const playerColors = ['red', 'yellow', 'green', 'blue', 'brown'];
const symbols = ['Sword', 'Parrot', 'Hook', 'Skull', 'Treasure', 'Rum'];
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
            board.push(initSpace("Start", colors, playerTokens));
            for (let i = 0; i < 6; i++) {
                board.push(symbols.shuffle().map(function(symbol) {
                    return initSpace(symbol, colors, 0);
                }));
            }
            board.push(initSpace("Sloop", colors, 0));
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

let ui = (function() {
    let updateSpace = function(space, idx, colors) {
        let s = document.getElementById("space-" + idx);
        if (idx === 0 || idx === 37) {
            // todo
        } else {
            let i = 1;
            let ps = s.querySelector(".players");
            ps.innerHTML = '<div class="player player-1"></div><div class="player player-2"></div><div class="player player-3"></div>';
            colors.forEach((color) => {
                for (var j = 0; j < space.get(color); j++) {
                    ps.querySelector(".player-" + i++).classList.add("player-" + color);
                }
            });
        }
    };

    return {
        initBoard: function(spaces, colors) {
            let start = document.getElementById("space-0");
            let sloop = document.getElementById("space-37");
            for (var i = colors.length; i < 5; i++) {
                start.querySelector(".player-" + (i + 1)).style.display = "none";
                sloop.querySelector(".player-" + (i + 1)).style.display = "none";
            }
            this.updateBoard(spaces, colors);
        },
        updateBoard: function(spaces, colors) {
            spaces.map((space, idx) => updateSpace(space, idx, colors));
        }
    };
})();

let controller = (function(deck, board, ui) {
    var players; // {"red" => {name: "Peter", cards: {"sword" => 0, "parrot" => 2, ...}}, "yellow" => {name: "Ralph", cards: Map(6)}, ...}

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
            ui.initBoard(board.peekBoard(), colors);
        },
        colorsInPlay: function() {
            return Array.from(players.keys());
        },
        peekPlayers: function() {
            return players;
        }
    };
})(deck, board, ui);
