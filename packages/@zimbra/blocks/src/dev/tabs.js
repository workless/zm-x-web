import { h } from 'preact';
import { Tabs, Tab } from '../';

export default function TabsDemo() {
	return (
		<div>
			<h1><pre>{`<Tabs />`}</pre></h1>
			<ul style="margin-left: 15px; text-align: left">
				<li>
					<strong>...props</strong> - props to be passed onto the container
				</li>
				<li>
					<strong>children</strong>{' - Children are expected to be <Tab> components'}
				</li>
				<li>
					<strong>onChangeActive</strong>{` - Optional callback that fires when a new active tab is set; callback receives index of newly selected tab as only argument`}
				</li>
				<li>
					<strong>tabActiveClass</strong>{` - Optional CSSStyleDeclaration object that will be applied to the active tab element's style attribute`}
				</li>
			</ul>
			<h1><pre>{`<Tab />`}</pre></h1>
			<ul style="margin-left: 15px; text-align: left">
				<li>
					<strong>title</strong>{' - The title to display in the <Tabs> navigation list'}
				</li>
				<li>
					<strong>...props</strong> - props to be passed onto the container
				</li>
				<li>
					<strong>children</strong> - Children to be rendered inside the Tab
				</li>
			</ul>
			<h2>Demo</h2>
			<p>Only the active tab will be focusable with tabindex. Tabs can be navigated with the left/right arrow keys.</p>
			<Tabs active={1} style={'padding: 5px; border: 2px solid lightblue'}>
				<Tab title={'Numba One'}>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquet pulvinar neque at fringilla. Cras tristique risus lectus, non elementum ipsum blandit nec. Nulla condimentum quam ut ipsum auctor, vitae pellentesque augue pretium. Nam vitae lacus tellus. Donec dapibus in elit id auctor. Interdum et malesuada fames ac ante ipsum primis in faucibus. Integer pellentesque efficitur venenatis. Praesent feugiat accumsan sem at porta. Mauris vitae urna nisi. Sed vel magna ut eros interdum posuere eu at libero. Nulla ipsum dolor, ultricies eget facilisis et, malesuada nec lacus. Donec in consectetur nisi. Aenean tristique tortor nec sapien gravida, in sagittis ante cursus. Ut condimentum vulputate ultricies. In imperdiet est ac nisl tempus cursus. Integer a ex pharetra, convallis lectus id, maximus diam.
				</Tab>
				<Tab title={'Numero Dos'}>
					Duis non placerat eros, eu fringilla sapien. Morbi diam urna, feugiat eu mi eu, porttitor sollicitudin orci. Nullam cursus odio velit, non sodales elit ultricies mattis. Morbi eleifend accumsan eros, at porttitor odio. Donec eros dui, elementum suscipit dui sagittis, tempor tempor arcu. In consectetur justo vulputate nisi accumsan fermentum. Phasellus ac consequat diam. Sed tincidunt, velit in consectetur mollis, nisl tortor maximus est, et vehicula ante justo ac nunc. Nullam felis nunc, molestie nec interdum sit amet, ultricies et ipsum. Aliquam aliquet lorem et diam aliquet, non consectetur neque gravida. Nam in risus vitae neque rhoncus porttitor ac vel est. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus semper pretium ligula non aliquam. Proin sagittis vulputate nisl id pharetra. Nulla quis tristique lacus. Vivamus rhoncus sapien et blandit faucibus.
				</Tab>
				<Tab title={'Tab Three'}>
					Sed a purus leo. Vestibulum ac odio scelerisque, ultricies nulla nec, auctor dolor. In efficitur neque id dapibus efficitur. Sed rutrum, arcu nec consectetur eleifend, est metus ornare dui, ac tincidunt augue magna ac tortor. Maecenas non congue augue, a lobortis dolor. Suspendisse quis ipsum lacinia, porttitor neque eget, vestibulum odio. Vivamus sodales nisl eu tristique laoreet. Proin laoreet velit non sem pulvinar tempor. Nulla ac neque dolor. Suspendisse quam eros, feugiat nec lobortis nec, faucibus ut nunc. Quisque est augue, egestas ut rutrum eu, posuere sit amet turpis. Maecenas aliquam at metus et suscipit. Nulla id urna sagittis, ultrices tortor a, fringilla nisl. In a placerat ipsum.
				</Tab>
			</Tabs>
		</div>
	);
}
