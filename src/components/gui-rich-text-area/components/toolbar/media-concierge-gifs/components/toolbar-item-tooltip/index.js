import { h, Component } from 'preact';
import { Text } from 'preact-i18n';
import { Button } from '@zimbra/blocks';
import GiphyJustifiedLayout from '../giphy-justified-layout';
import SearchInput from '../search-input';
import style from './style';
import cx from 'classnames';

// @enum activeView
const POPULAR = 1;
const RECENT = 2;

export default class ToolbarItemTooltip extends Component {
	handleSearch = (searchTerm) => {
		this.setState({ activeView: undefined, tags: searchTerm });
	}

	handleClickPopular = () => {
		this.setState({ activeView: POPULAR, tags: '' });
	}

	handleClickRecent = () => {
		this.setState({ activeView: RECENT, tags: 'latest' });
	}

	render({ onClickGif, ...props }, { tags, activeView }) {
		return (
			<div {...props} class={cx(style.tooltip, props.class)}>
				<div class={style.searchBar}>
					<SearchInput
						value={tags}
						onSearch={this.handleSearch}
						class={style.searchInput}
					/>

					<span>
						<Button styleType="secondary" onClick={this.handleClickPopular} class={activeView === POPULAR && style.active}>
							<Text id="mediaConcierge.gifs.buttons.popular" />
						</Button>
						<Button styleType="secondary" onClick={this.handleClickRecent} class={activeView === RECENT && style.active}>
							<Text id="mediaConcierge.gifs.buttons.recent" />
						</Button>
					</span>
				</div>

				<div class={style.content}>
					<GiphyJustifiedLayout
						onClickGif={onClickGif}
						tags={tags}
					/>
				</div>
			</div>
		);
	}
}
