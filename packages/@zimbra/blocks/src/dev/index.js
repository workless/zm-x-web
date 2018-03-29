import { h } from 'preact';
import { Link } from 'preact-router/match';
import Icon from './icon';
import Button from './button';
import ClickOutsideDetector from './click-outside-detector';
import ContainerSize from './container-size';
import Dialog from './dialog';
import Popover from './popover';
import Scrim from './scrim';
import Select from './select';
import Spinner from './spinner';
import Tabs from './tabs';
import Tooltip from './tooltip';
import AffixBottom from './affix-bottom';
import './style';

const NAV = {
	AffixBottom,
	Button,
	ClickOutsideDetector,
	ContainerSize,
	Dialog,
	Icon,
	Popover,
	Scrim,
	Select,
	Spinner,
	Tabs,
	Tooltip
};

export default ({ block, urlPrefix='/dev' }) => {
	let Demo = block && NAV[block];
	return (
			<div class="blocks_demo_wrapper">
				<nav>
					<h3>Block Demos</h3>
					<ul>
						{ Object.keys(NAV).map(key =>
							<li><Link href={`${urlPrefix}/${key}`} activeClassName="active">{key}</Link></li>
						)}
					</ul>
				</nav>
				<main>
					{ Demo ? <Demo /> :  <p>Select a Demo from the Nav at left</p> }
				</main>
			</div>
	);
};
