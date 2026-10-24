const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE = 81
const STROKE = 5
const NORMAL = [136, 136, 136]
const ACTIVE = [255, 143, 163]

const CRC_TABLE = (() => {
  const table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0)
  ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const rowSize = SIZE * 4 + 1
  const raw = Buffer.alloc(rowSize * SIZE)
  for (let y = 0; y < SIZE; y++) {
    raw[y * rowSize] = 0
    rgba.copy(raw, y * rowSize + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function roundedRectDistance(px, py, cx, cy, size, radius) {
  const qx = Math.abs(px - cx) - (size / 2 - radius)
  const qy = Math.abs(py - cy) - (size / 2 - radius)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
}

function strokeCoverage(distance) {
  return Math.max(0, Math.min(1, 0.5 + (STROKE / 2 - distance)))
}

function toolsCoverage(x, y) {
  const centers = [[24, 24], [57, 24], [24, 57], [57, 57]]
  let best = 0
  for (const [cx, cy] of centers) {
    best = Math.max(best, strokeCoverage(Math.abs(roundedRectDistance(x, y, cx, cy, 22, 6))))
  }
  return best
}

function heartCoverage(x, y) {
  const samples = 4
  let hit = 0
  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const px = x - 0.5 + (sx + 0.5) / samples
      const py = y - 0.5 + (sy + 0.5) / samples
      const nx = (px / SIZE) * 2.4 - 1.2
      const ny = 1.2 - (py / SIZE) * 2.4
      const t = nx * nx + ny * ny - 1
      if (t * t * t - nx * nx * ny * ny * ny <= 0) hit += 1
    }
  }
  return hit / (samples * samples)
}

function paint(coverageFn, color) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const alpha = coverageFn(x + 0.5, y + 0.5)
      if (alpha <= 0) continue
      const index = (y * SIZE + x) * 4
      rgba[index] = color[0]
      rgba[index + 1] = color[1]
      rgba[index + 2] = color[2]
      rgba[index + 3] = Math.round(alpha * 255)
    }
  }
  return rgba
}

const outDir = path.join(__dirname, '..', 'src', 'static')
const outputs = [
  ['tab-tools.png', paint(toolsCoverage, NORMAL)],
  ['tab-tools-active.png', paint(toolsCoverage, ACTIVE)],
  ['tab-baby.png', paint(heartCoverage, NORMAL)],
  ['tab-baby-active.png', paint(heartCoverage, ACTIVE)],
]

for (const [name, rgba] of outputs) {
  fs.writeFileSync(path.join(outDir, name), encodePng(rgba))
}

console.log(`generated ${outputs.map(([name]) => name).join(', ')}`)
