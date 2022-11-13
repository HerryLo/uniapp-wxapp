export function handleTime(obsTime) {
    if(!obsTime) return '--'
    const time = new Date(obsTime);
    const year = time.getFullYear();
    const month = time.getMonth()+1;
    const day = time.getDate();
    const hour = time.getHours();
    const minutes = time.getMinutes()
    return `${year}-${month}-${day} ${hour}:${minutes}`
  }