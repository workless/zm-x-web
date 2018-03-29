import { h, Component, cloneElement } from 'preact';
import { Dialog, FixedDialog, ModalDialog } from '..';

const style = `
#dialog-demo {
	min-height: 150vh;

}
div[role="dialog"] {
	background-color: white;
	min-height: 100px;
}
`;

export default function ComposedDialogDemo() {
	return (
		<div id="dialog-demo">
			<style>{style}</style>
			<div>
				<h1>{'<Dialog>'}</h1>
				<p>Basically a popup window. Use styles to position your dialog, and pass it children to render inside. Works like magic.</p>
				<table style="width: 100%;">
					<thead>
						<tr>
							<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>onClickOutside</td>
							<td>Function</td>
							<td />
							<td>An event handler to be called when a click happens outside the {'<Dialog>'}</td>
						</tr>
						<tr>
							<td>centered</td>
							<td />
							<td />
							<td>Preset position to center of the screen</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div>
				<h2><kbd>{'<Dialog>'}</kbd></h2>
				<p>Default Dialog</p>
				<DialogDemo />
			</div>

			<div>
				<h2><kbd>{'<FixedDialog>'}</kbd></h2>
				<p>A fixed position dialog that stays in place when the page is scrolled</p>
				<FixedDialogDemo />
			</div>

			<div>
				<h2><kbd>{'<ModalDialog>'}</kbd></h2>
				<p>A modal dialog that doesnt allow interactions behind it.</p>
				<pre>Props</pre>
				<dl>
					<dt>overlayClass</dt>
					<dd>A class for the overlay that blocks the page</dd>
				</dl>
				<ModalDialogDemo />
			</div>

			<h1>Examples</h1>
			<div>
				<h2><kbd>{'<DrawerDialogExample>'}</kbd></h2>
				<p>With some animation styling, you can use Dialogs to make engaging interactive menus and panels</p>
				<DrawerDialogExample />
			</div>
		</div>
	);
}

class DialogController extends Component {
	state = { open: false }

	toggleDialog = () => {
		this.setState({ open: !this.state.open });
	}

	closeDialog = (e) => {
		this.setState({ open: false });
		e.stopPropagation(); // need this to disallow calling closeDialog and toggleDialog in the same event.
	}

	render({ caption, children, ...props }, { open }) {
		return (
			<div>
				<button onClick={this.toggleDialog}>{caption}</button>
				{open && children.map((child) => cloneElement(child, { onClickOutside: open && this.closeDialog }))}
			</div>
		);
	}
}

function DialogDemo() {
	return (
		<DialogController caption="Open default Dialog">
			<Dialog style="top: auto; left: 75%; transform: translate(-50%, -50%); border: 2px solid silver">
				Hello I am a dialog. I support {'<ClickOutsideDetector>'}
			</Dialog>
		</DialogController>
	);
}

function FixedDialogDemo() {
	return (
		<DialogController caption="Open Fixed Dialog">
			<FixedDialog centered style="border: 2px solid silver">
				I am a fixed dialog that stays as you scroll the page. I also support {'<ClickOutsideDetector>'}!
			</FixedDialog>
		</DialogController>
	);
}

function ModalDialogDemo() {
	return (
		<DialogController caption="Open Modal Dialog">
			<ModalDialog style="border: 2px solid silver">
				I am a modal dialog, you must interact with me!
			</ModalDialog>
		</DialogController>
	);
}


const drawerStyles = `
.drawer {
	height: 100vh;
	width: 30vw;
	transform: translateX(-100%);
	animation: slide-in 0.5s forwards;
}

.drawerClosing {
	transform: none;
	animation: slide-out 0.5s backwards;
}

@keyframes slide-in {
	100% { transform: none; }
}

@keyframes slide-out {
	100% { transform: translateX(-100%); }
}
`;

class DrawerDialogExample extends Component {
	state = { open: false }

	toggleDialog = () => {
		this.setState({ open: !this.state.open });
	}

	closeDialog = (e) => {
		this.setState({ closing: true });
		setTimeout(() => this.setState({ open: false, closing: false }), 500);
		e.stopPropagation(); // need this to disallow calling closeDialog and toggleDialog in the same event.
	}

	render(props, { closing, open }) {
		return (
			<div>
				<style>{drawerStyles}</style>
				<button onClick={this.toggleDialog}>{'Open Navigation Drawer'}</button>
				{open && (
					<ModalDialog centered={false} onClickOutside={open && this.closeDialog} class={`drawer${closing ? ' drawerClosing' : ''}`}>
						<nav>
							<ol>
								<li><a href="#">Link 1</a></li>
								<li><a href="#">Link 2</a></li>
								<li><a href="#">Link 3</a></li>
							</ol>
						</nav>
					</ModalDialog>
				)}
			</div>
		);
	}
}
