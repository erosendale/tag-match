// Fisher-Yates shuffle
/**
 * Shuffles array in place.
 * @param {Array} a An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function isEmpty(obj) {
    return Object.getOwnPropertyNames(obj).length === 0
}

module.exports = {
    shuffle,
    isEmpty
};