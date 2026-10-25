export const BABY_PREFIX = 'baby.'
export const PROFILE_KEY = 'baby.profile.v1'
export const GROWTH_KEY = 'baby.growth.v1'
export const VACCINES_KEY = 'baby.vaccines.v1'
export const MILESTONES_KEY = 'baby.milestones.v1'
export const MOODS_KEY = 'baby.moods.v1'
export const NOTES_KEY = 'baby.notes.v1'
export const MOM_KEY = 'baby.mom.v1'
export const TRAVEL_KEY = 'baby.travel.v1'
export const META_KEY = 'baby.meta.v1'
export const BACKUP_KEY = 'baby.backup.v1'
export const RECORDS_PREFIX = 'baby.records.v1.'

export function recordsKey(month) {
  return `${RECORDS_PREFIX}${month}`
}

export function isBabyKey(key) {
  return typeof key === 'string' && key.startsWith(BABY_PREFIX)
}
