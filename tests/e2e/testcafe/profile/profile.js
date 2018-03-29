import minimist from 'minimist';

class Profile {
	constructor() {
		this.defaultPath = './default.json';
		this.args = minimist(process.argv.slice(2));
		this.profile = this.args.profile;
		return this.profile != null ? require(`./${this.profile}.json`) : require(this.defaultPath);
	}
}

export let profile = new Profile();