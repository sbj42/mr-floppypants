import { getImage } from '../images';
import { Achievement } from '../game';
import { CARD_WIDTH, CARD_HEIGHT, CARD_MARGIN, CARD_PADDING } from './toast';

export function achievementCard(achievement: Achievement, collected = true) {
    const inner = document.createElement('div');
    inner.style.position = 'relative';
    inner.style.display = 'inline-block';
    inner.style.width = `${CARD_WIDTH}px`;
    inner.style.height = `${CARD_HEIGHT}px`;
    inner.style.margin = `${CARD_MARGIN}px`;
    inner.style.padding = `${CARD_PADDING}px`;
    inner.style.border = '1px solid #000';
    inner.style.backgroundColor = collected ? '#65deea' : '#bbb';
    inner.style.boxShadow = '0px 2px 2px rgba(0,0,0,0.5)';
    inner.style.textAlign = 'left';
    inner.style.fontFamily = 'sans-serif';

    const imageOuter = document.createElement('div');
    imageOuter.style.paddingRight = '10px';
    imageOuter.style.cssFloat = 'left';
    imageOuter.style.width = `${CARD_HEIGHT}px`;
    imageOuter.style.height = `${CARD_HEIGHT}px`;
    imageOuter.style.textAlign = 'center';
    inner.appendChild(imageOuter);
    const image = getImage(achievement.image, true);
    const { width, height } = image;
    if (width > height) {
        image.style.width = `${CARD_HEIGHT}px`;
    } else {
        image.style.height = `${CARD_HEIGHT}px`;
    }
    if (!collected) {
        image.style.filter = 'brightness(0%)';
        image.style.webkitFilter = 'brightness(0%)';
    }
    imageOuter.appendChild(image);

    const title = document.createElement('div');
    title.textContent = title.innerText = achievement.label;
    title.style.fontWeight = 'bold';
    if (!collected) {
        title.style.paddingTop = '15px';
    } else {
        title.style.paddingTop = '5px';
    }
    inner.appendChild(title);

    if (collected) {
        const description = document.createElement('div');
        description.textContent = description.innerText = achievement.description;
        description.style.fontSize = '80%';
        inner.appendChild(description);
    }

    return inner;
}
