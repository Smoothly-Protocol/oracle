import { ObjectId } from "mongodb";

export default class User {
	constructor(
		public id?: ObjectId, 
		public eth1Addr: string, 
		public validatorId: number,
		public pubKey: string, 
		public validatorIndex: number, 
		public missedSlots: number,
		public slashFee: number,
		public firstBlockProposed: boolean,
		public firstMissedSlot: boolean 
	) {}
}
