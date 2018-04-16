import { h, cloneElement, Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import debounce from '@zimbra/util/src/debounce';
import VirtualList from 'preact-virtual-list';
import { KeyCodes } from '@zimbra/blocks';
import InfiniteScroll from '../infinite-scroll';
import { getId, filterDuplicates } from '../../lib/util';
import style from './style';

export default class SmartList extends Component {
	static defaultProps = {
		selected: []
	}
	getId = this.props.getId || getId;

	/** Creates a function that updates selection based on a mutator */

	updateSelection = fn => (...args) => {
		let { items, selected, onSelectionChange } = this.props;
		if (items.length) {
			selected = filterDuplicates(fn(selected, items, ...args) || selected);
		}
		onSelectionChange(selected);
	};

	/** Toggle selection of an item on/off based on current state */
	toggleItemSelected = this.updateSelection((selected, items, { item }) => {
		let id = this.getId(item);
		if (selected.indexOf(id) < 0) {
			return selected.concat(id);
		}
		return selected.filter(i => i !== id);
	});

	/** Change selection to contain only a single item. */
	selectItem = this.updateSelection((selected, items, { item }) => [
		this.getId(item)
	]);

	/** Toggle selection to contain all items or no items. */
	toggleSelectAll = this.updateSelection(
		(selected, items) =>
			selected.length && selected.length === items.length
				? []
				: items.map(this.getId)
	);

	/** Move selection cursor by an integer offset (-1 for up, 1 for down), optionally with multi-select. */
	bumpSelection = debounce(
		this.updateSelection((selected, items, multi) => {
			let offset = this.queuedBumpOffset;
			let [low, high] = this.getBounds(selected);

			if (low == null || high == null) return [this.getId(items[0])];

			if (offset > 0 && high < items.length - 1) {
				selected = selected.concat(
					this.selectItemRange(items, high, high + offset)
				);
			}

			if (offset < 0 && low > 0) {
				selected = selected.concat(
					this.selectItemRange(items, low + offset, low).reverse()
				);
			}

			this.queuedBumpOffset = 0;
			return multi ? selected : selected.slice(selected.length - 1);
		}),
		1000 / 144
	);

	queuedBumpSelection = (offset, multi) => {
		this.queuedBumpOffset = (this.queuedBumpOffset || 0) + offset;
		this.bumpSelection(multi);
	};

	/** Move the selection start to the first list item, optionally with multi-select. */
	selectFirst = this.updateSelection((selected, items, multi) => {
		let [low] = this.getBounds(selected);
		if (!multi) return [this.getId(items[0])];
		return selected.concat(this.selectItemRange(items, 0, low || 1));
	});

	/** Move the selection end to the last list item, optionally with multi-select. */
	selectLast = this.updateSelection((selected, items, multi) => {
		let [high] = this.getBounds(selected);
		if (!multi) return [this.getId(items[items.length - 1])];
		return selected.concat(
			this.selectItemRange(items, high || items.length - 2, items.length - 1)
		);
	});

	/** Computes the smallest and largest index within the current selection. */
	getBounds(selection) {
		let { items } = this.props,
			lowest,
			highest;
		for (let i = 0; i < items.length; i++) {
			let id = this.getId(items[i]);
			if (selection.indexOf(id) !== -1) {
				if (!lowest || i < lowest) lowest = i;
				if (!highest || i > highest) highest = i;
			}
		}
		return [
			lowest == null ? highest : lowest,
			highest == null ? lowest : highest
		];
	}

	/** Create a selection of items ID's for the given index range */
	selectItemRange(items, start = 0, end = 0) {
		let selected = [];
		for (let i = start; i <= end; i++) {
			selected.push(this.getId(items[i]));
		}
		return selected;
	}

	/** Get an item from .items by its ID */
	getItem(id) {
		let { items } = this.props;
		for (let i = items.length; i--; ) {
			if (this.props.getId(items[i]) === id) {
				return items[i];
			}
		}
	}

	/** Handle keyboard input within the list */
	onKey = e => {
		let { selection } = this.props,
			key = e.keyCode;
		if (key === KeyCodes.UP_ARROW && e.metaKey) key = KeyCodes.HOME;
		if (key === KeyCodes.DOWN_ARROW && e.metaKey) key = KeyCodes.END;
		switch (key) {
			case KeyCodes.UP_ARROW:
				this.queuedBumpSelection(-1, e.shiftKey);
				break;
			case KeyCodes.DOWN_ARROW:
				this.queuedBumpSelection(1, e.shiftKey);
				break;
			case KeyCodes.CARRIAGE_RETURN:
				selection &&
					this.handleItemClick({
						item: this.getItem(selection[selection.length - 1]),
						event: e
					});
				return;
			case KeyCodes.HOME:
				this.selectFirst(e.shiftKey);
				break;
			case KeyCodes.END:
				this.selectLast(e.shiftKey);
				break;
			default:
				return;
		}

		e.preventDefault();
		e.stopPropagation();
		return false;
	};

	/** Action methods available to the header as props.actions */
	actions = {
		selectItem: this.selectItem,
		toggleItemSelected: this.toggleItemSelected,
		toggleSelectAll: this.toggleSelectAll
	};

	/** Handles clicking/activation of an item (passed as onClick to item components) */
	handleItemClick = e => {
		let action = e.action || 'selectItem';
		if (e.event && (e.event.ctrlKey || e.event.metaKey)) {
			action = 'toggle';
		}
		if (action === 'toggle') action = 'toggleItemSelected';
		this.actions[action](e);
	};

	/** Handlers are wrapped to ensure a .item property is available on them. Wrapper handler creation is memoized by item id. */
	clickHandlers = {};
	createItemClickHandler = item => e => {
		if (e instanceof Event) {
			e = { event: e };
		}
		this.handleItemClick({ item, ...e });
	};

	/** Renders a single list item */
	renderItem = item => {
		let { renderItem, ListItem, items, selected } = this.props,
			id = this.getId(item),
			allSelected = selected.length && selected.length === items.length,
			itemProps = {
				item,
				selected: selected.indexOf(id) !== -1,
				onClick:
					this.clickHandlers[id] ||
					(this.clickHandlers[id] = this.createItemClickHandler(item)),
				allSelected
			};
		if (renderItem) return renderItem(itemProps);
		return <ListItem {...itemProps} />;
	};

	render({
		items,
		renderItem,
		ListItem,
		selected,
		header,
		empty,
		virtualized,
		rowHeight,
		vanilla,
		innerClass,
		noItemsClass,
		noItemsMessage,
		infinite,
		onScroll,
		hasMore,
		loadMore,
		isFetchingData,
		...props
	}) {
		let allSelected = selected.length && selected.length === items.length;

		let childProps = {
			actions: this.actions,
			selected,
			items,
			allSelected
		};

		if (typeof header === 'function') {
			header = h(header, childProps);
		}
		else if (header && header.nodeName) {
			header = cloneElement(header, childProps);
		}

		let listProps = {
			onScroll,
			class: cx(!vanilla && style.inner, innerClass),
			tabIndex: '0',
			onKeyDown: this.onKey,
			scrollbar: true
		};

		return (
			<div {...props} class={cx(!vanilla && style.smartList, props.class)}>
				{header}

				{virtualized && items && items.length > 0 ? (
					infinite ? (
						<InfiniteScroll
							rowHeight={rowHeight}
							overscanCount={250}
							data={items}
							renderRow={this.renderItem}
							hasMore={hasMore}
							loadMore={loadMore}
							isFetchingData={isFetchingData}
							{...listProps}
						/>
					) : (
						<VirtualList
							rowHeight={rowHeight}
							overscanCount={250}
							data={items}
							renderRow={this.renderItem}
							{...listProps}
						/>
					)
				) : (
					items && (
						<div {...listProps}>
							{!virtualized && items && items.length > 0
								? items.map(this.renderItem)
								: empty || (
									<div class={cx(!vanilla && style.noItems, noItemsClass)}>
										{noItemsMessage || <Text id="lists.empty" />}
									</div>
								)}
						</div>
					)
				)}
			</div>
		);
	}
}
