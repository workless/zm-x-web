import { getEmailDomain, isAddressTrusted, capitalizeFirstLetter }  from 'src/lib/util';

describe('util', () => {

	describe('getEmailDomain', () => {
		it('should return the domain portion of a valid email address', () => {
			expect(getEmailDomain('foo@bar.com')).to.equal('bar.com');
		});
		it('should return something falsey on an invalid email address', () => {
			expect(!!getEmailDomain('notanemailaddress')).to.be.false;
		});
		it('should return something falsey on an undefined input', () => {
			expect(!!getEmailDomain(undefined)).to.be.false;
		});
	});

	describe('isAddressTrusted', () => {
		it('should trust email address "foo@bar.com" against string check of "foo@bar.com"', () => {
			expect(isAddressTrusted('foo@bar.com', 'foo@bar.com')).to.be.true;
		});
		it('should trust email address "foo@bar.com" against array check of ["foo@bar.com"]', () => {
			expect(isAddressTrusted('foo@bar.com', ['foo@bar.com'])).to.be.true;
		});
		it('should not trust email address "foo@bar.com" against array check of ["bad@bar.com"]', () => {
			expect(isAddressTrusted('foo@bar.com', ['bad@bar.com'])).to.be.false;
		});
		it('should trust  "foo@bar.com" against string domain check of "bar.com"', () => {
			expect(isAddressTrusted('foo@bar.com', 'bar.com')).to.be.true;
		});
		it('should trust  "foo@bar.com" against array domain check of ["bar.com"]', () => {
			expect(isAddressTrusted('foo@bar.com', ['bar.com'])).to.be.true;
		});
		it('should trust "foo@subdomain.bar.com" against array domain check of ["bar.com"]', () => {
			expect(isAddressTrusted('foo@subdomain.bar.com', ['bar.com'])).to.be.true;
		});
		it('should not trust "foo@bar.com" against array domain check of ["subdomain.bar.com"]', () => {
			expect(isAddressTrusted('foo@bar.com', ['subdomain.bar.com'])).to.be.false;
		});
		it('should not trust "foo@bar.com" against undefined check list', () => {
			expect(isAddressTrusted('foo@bar.com', undefined)).to.be.false;
		});
	});

	describe('capitalizeFirstLetter', () => {
		it('should capitalize the first letter of a sentence', () => {
			[ 'one', 'two', 'Three', 'Four', 'five' ].map(capitalizeFirstLetter).forEach((word, index, arr) => {
				const uncapitalizedWord = arr[index];
				expect(word[0]).to.equal(uncapitalizedWord[0].toUpperCase());
				expect(word.slice(0, -1)).to.equal(uncapitalizedWord.slice(0, -1));
			});
		});
	});
});
