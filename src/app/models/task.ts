export class Task {
    constructor(
        public title: string,
        public description: string,
        public pieces: string,
        public type: string,
        public RAF: string,
        public redFlag: boolean
    ) {}
}
