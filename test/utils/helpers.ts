import { User } from "../../src/types";

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function decodeUser(data: any): User[] {
  for(let i = 0; i < data.length; i++) {
    for(let x = 0; x < data[i].length; x++) {
      if(data[i][x] == 0) {
        data[i][x] = 0;
      } else {
        data[i][x] = bufferToNumber(Buffer.from(data[i][x]));
      }
    }
  } 
  return data;
}

function bufferToNumber(buf: Buffer): number {
  return Number(`0x${buf.toString('hex')}`);
}
