import { getEmailDomain, isAddressTrusted, capitalizeFirstLetter, pluck }  from 'src/lib/util';

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
			const expected = [ 'One', 'Two', 'Three DIFFERENT words', 'Four Words', 'Five words' ];
			const actual = [ 'one', 'two', 'Three DIFFERENT words', 'Four Words', 'five words' ].map(capitalizeFirstLetter);

			actual.forEach((actualWord, index) => {
				expect(actualWord).to.equal(expected[index]);
			});
		});
	});

	describe.only('pluck', () => {
		it('should return undefined if no match exists', () => {
			expect(pluck([], 'foo', 1)).to.be.undefined;
		});

		it('should return first match if there are multiples', () => {
			expect(pluck[{ a: 'b', c: 1 }, { a: 'b', c: 2 }], 'a', 'b').to.eql({ a: 'b', c: 1 });
		});

		it('should check value using == equality, not verifying type', () => {
			expect(pluck[{ a: '1' }], 'a', 1).to.eql({ a: '1' });
		});

		it('should test using regext when value is a regex', () => {
			expect(pluck[{ a: 'b' }], 'a', /B/i).to.eql({ a: 'b' });
		});
	});
});
