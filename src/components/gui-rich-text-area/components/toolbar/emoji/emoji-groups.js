import emojioneList from 'emojione/emoji.json';

const EMOJIS_PER_ROW = 8;

function removeTone(name) {
	let [baseName] = name.split(' tone');
	return baseName;
}

let diversityEmojis = Object.keys(emojioneList).reduce((arr, key) => {
	let emojiName = emojioneList[key].name;
	if (emojiName.indexOf('tone') > -1 && arr.indexOf(removeTone(emojiName)) === -1) {
		arr.push(removeTone(emojiName));
	}
	return arr;
}, []);

const emojiGroups = {};

Object.keys(emojioneList).map(key => {
	let emoji = emojioneList[key];
	
	if (!emojiGroups[emoji.category]) {
		emojiGroups[emoji.category] = [];
	}

	if (emoji.name.indexOf('tone') > -1 && diversityEmojis.indexOf(removeTone(emoji.name)) > -1) return;
	
	let categoryMap = emojiGroups[emoji.category];
	if (!categoryMap[categoryMap.length - 1] ||
		categoryMap[categoryMap.length - 1].length === EMOJIS_PER_ROW) {
		categoryMap.push([]);
	}
	categoryMap[categoryMap.length - 1].push({
		name: emoji.name,
		unicode: emoji.unicode,
		shortname: emoji.shortname,
		emoji_order: emoji.emoji_order,
		aliases_ascii: emoji.aliases_ascii
	});
});

export default emojiGroups;