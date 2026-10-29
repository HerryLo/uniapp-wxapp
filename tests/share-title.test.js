import { describe, it, expect } from 'vitest'
import {
  buildShareTitle,
  toolNavTitle,
  toolShareTitle,
} from '../src/utils/shareTitle.js'

describe('buildShareTitle', () => {
  it('把页面标题拼在品牌名前面', () => {
    expect(buildShareTitle('宝宝喝奶记录')).toBe('宝宝喝奶记录｜垣计算')
  })

  it('空标题回退到默认文案', () => {
    expect(buildShareTitle('')).toBe('本地优先的宝宝记录工具｜垣计算')
  })

  it('纯空白标题也回退到默认文案', () => {
    expect(buildShareTitle('   ')).toBe('本地优先的宝宝记录工具｜垣计算')
  })
})

describe('toolNavTitle', () => {
  it('按工具 key 返回导航栏标题', () => {
    expect(toolNavTitle('unit')).toBe('单位换算')
  })

  it('未知工具 key 回退到工具箱', () => {
    expect(toolNavTitle('nope')).toBe('日常计算工具箱')
  })
})

describe('toolShareTitle', () => {
  it('按工具 key 返回具体工具名', () => {
    expect(toolShareTitle('vat')).toBe('增值税计算器｜垣计算')
  })

  it('未知工具 key 回退到工具箱', () => {
    expect(toolShareTitle('nope')).toBe('日常计算工具箱｜垣计算')
  })
})
