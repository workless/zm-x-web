import focusChildByIndex from 'src/focus-child-by-index';

describe('focusChildByIndex', () => {
	it('should call "target.childNodes[index].focus"', () => {
		const target = {
			childNodes: [
				{ focus: sinon.stub() }
			]
		};
		const index = 0;
		expect(target.childNodes[index].focus.callCount).to.equal(0);
		focusChildByIndex(target, index);
		expect(target.childNodes[index].focus.callCount).to.equal(1);
	});

	it('should do nothing if index is out of bounds', () => {
		const target = {
			childNodes: []
		};
		[ -1, 0, 1 ].forEach((index) => {
			expect(() => focusChildByIndex(target, index)).to.not.throw;
		});
	});

	it('should do nothing if given an invalid target', () => {
		const targets = [
			null,
			0,
			true,
			{},
			NaN,
			undefined
		];
		const index = undefined;
		targets.forEach((target) => {
			expect(() => focusChildByIndex(target, index)).to.not.throw;
		});
	});
});
