import isAlphanum from 'src/is-alphanum';

describe('isAlphanum', () => {
	it('should return true for alphanumeric characters', () => {
		'abcdefghijklmnopqrstuvwxyz0123456789'.split('').forEach((char) => {
			expect(isAlphanum(char), `expected isAlphanum("${char}") to return true`).to.be.ok;
		});
	});

	it('should return false for non-alphanumeric characters', () => {
		'~!@#$%^&*()_+`-=[]{};\':"./>?'.split('').forEach((char) => {
			expect(isAlphanum(char), `expected isAlphanum("${char}") to return false`).to.not.be.ok;
		});
	});
});
