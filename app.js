const playerColors = ['red', 'yellow', 'green', 'blue', 'brown'];
const symbols = ['sword', 'parrot', 'hook', 'skull', 'treasure', 'rum'];
const playerTokens = 6;

let randomIndexes = function(num) {
    let idxs = new Set();
    while (idxs.size < num) {
        idxs.add(Math.floor(Math.random() * num));
    }
    return Array.from(idxs);
}

Array.prototype.shuffle = function() {
    return randomIndexes(this.length).map(idx => this[idx]);
}

let deck = (function() {
    var cards; // ["hook", "hook", "skull", ...]

    return {
        init: function() {
            let deck = new Array();
            for (let i = 0; i < 17; i++) deck.push(symbols);
            cards = deck.flat().shuffle();
        },
        drawCard: function() {
            return cards.shift();
        },
        returnCard: function(card) {
            cards.push(card);
        },
        peekDeck: function() {
            return cards;
        }
    };
})();

let board = (function() {
    const sloop = 37;
    var spaces; // [{"red" => 6, "yellow" => 6, "symbol" => "start"}, {"red" => 0, "yellow" => 0, "symbol" => "rum"}, ...]

    let initSpace = function(symbol, colors, count) {
        return colors.reduce(function(acc, color) {
            return acc.set(color, count);
        }, new Map()).set("symbol", symbol);
    };

    let countPlayersOnSpace = function(space) {
        let count = 0;
        space.forEach((value, key) => {if (key !== "symbol") count += value});
        return count;
    };

    let findNextSpace = function(startSpace, symbol) {
        var nextSpace;
        for (let i = startSpace + 1; i <= sloop; i++) {
            if (spaces[i].get("symbol") === symbol && countPlayersOnSpace(spaces[i]) === 0) {
                nextSpace = i;
                break;
            }
        }
        return nextSpace;
    };

    let findPrevSpace = function(startSpace) {
        var prevSpace;
        for (let i = startSpace - 1; i > 0; i--) {
            let count = countPlayersOnSpace(spaces[i])
            if (count === 1 || count === 2) {
                prevSpace = i;
                break;
            }
        }
        return prevSpace;
    }

    return {
        init: function(colors) {
            let board = new Array();
            board.push(initSpace("start", colors, playerTokens));
            for (let i = 0; i < 6; i++) {
                board.push(symbols.shuffle().map(function(symbol) {
                    return initSpace(symbol, colors, 0);
                }));
            }
            board.push(initSpace("sloop", colors, 0));
            spaces = board.flat();
        },
        isPlayerOnSpace: function(playerColor, space) {
            return spaces[space].get(playerColor) > 0;
        },
        movePlayerBackward: function(playerColor, startSpace) {
            let cardsToPickup = 0;
            if (this.isPlayerOnSpace(playerColor, startSpace)) {
                let moveTo = findPrevSpace(startSpace);
                if (moveTo) {
                    cardsToPickup = countPlayersOnSpace(spaces[moveTo]);
                    spaces[startSpace].set(playerColor, spaces[startSpace].get(playerColor) - 1);
                    spaces[moveTo].set(playerColor, spaces[moveTo].get(playerColor) + 1);
                }
            }
            return cardsToPickup;
        },
        movePlayerForward: function(playerColor, startSpace, cardPlayed) {
            if (this.isPlayerOnSpace(playerColor, startSpace)) {
                let moveTo = findNextSpace(startSpace, cardPlayed) || sloop;
                spaces[startSpace].set(playerColor, spaces[startSpace].get(playerColor) - 1);
                spaces[moveTo].set(playerColor, spaces[moveTo].get(playerColor) + 1);
            }
        },
        winningColor: function(playerColors) {
            return playerColors.filter(color => spaces[sloop].get(color) === playerTokens)[0];
        },
        peekBoard: function() {
            return spaces;
        }
    };
})();

let controller = (function(deck, board) {
    var players; // {"red" => {name: "Peter", cards: Map(6)}, "yellow" => {name: "Ralph", cards: Map(6)}, ...}

    let emptyHand = function() {
        return symbols.reduce(function(acc, symbol) {
            return acc.set(symbol, 0);
        }, new Map());
    };

    let dealStartHand = function(player) {
        for (let i = 0; i < 6; i++) {
            let card = deck.drawCard();
            player.cards.set(card, player.cards.get(card) + 1);
        }
    };

    let initPlayers = function(colors, names) {
        players = colors.reduce(function(acc, color, idx) {
            return acc.set(color, {"name": names[idx], "cards": emptyHand()})
        }, new Map());
        players.forEach(player => dealStartHand(player));
    };

    return {
        init: function(playerNames) {
            let colors = playerColors.slice(0, playerNames.length);
            deck.init();
            board.init(colors);
            initPlayers(colors, playerNames);
        },
        colorsInPlay: function() {
            return Array.from(players.keys());
        },
        peekPlayers: function() {
            return players;
        }
    };
})(deck, board);
