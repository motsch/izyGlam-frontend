import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterAutocomplete' })
export class FilterAutocomplete implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(objectsArray: any[], searchString: string | undefined, type?: string | undefined): any[] {
    if (!objectsArray) return [];
    if (!searchString) return objectsArray;
    if(type) {
      searchString = searchString;
      console.log("searchString : " + JSON.stringify(searchString))
    } else {
      searchString = searchString.toLowerCase();
    }

    return objectsArray.filter((obj) => {
      for (const key in obj) {
        if (
          key == 'id' ||
          key == 'roleId' ||
          key == 'darkerColor' ||
          key == 'modelId' ||
          key == 'groupId' ||
          key == 'modelBaseId' ||
          key == 'picture' ||
          key == 'mapId' ||
          key == 'sensorMapId' ||
          key == 'status' ||
          key == 'batteryStatus'||
          key == 'statusIcon'||
          key == 'statusText'||
          key == 'statusSort'||
          key == 'statusColor'||
          key == 'statusIconColor'||
          key == 'statusClass'||
          key == 'siteId'||
          key == 'batteryIcon'||
          key == 'availableIcon'||
          key == 'availableText'||
          key == 'availableSort'||
          key == 'isAvailable'
        ) {
          continue;
        } else if (
          obj[key] != null &&
          obj[key].toString().toLowerCase().includes(searchString)
        ) {
          return true;
        }
      }
      return false;
    });
  }
}
