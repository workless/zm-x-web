export default function forceHTTPS() {
	if (
		window.location.protocol !== 'https:' &&
		window.location.hostname !== 'localhost'
	) {
		window.location.href =
		`https:${window.location.href.substring(window.location.protocol.length)}`;
	}
}
