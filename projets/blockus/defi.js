// Définition des pièces avec leurs formes
// Chaque pièce est représentée par une matrice où 1 = bloc, 0 = vide
const PIECES = {
    // 1 bloc - 1 combinaison
    piece1_1: {
        name: "Mono",
        blocks: 1,
        shape: [[1]]
    },
    
    // 2 blocs - 1 combinaison
    piece2_1: {
        name: "Domino",
        blocks: 2,
        shape: [[1, 1]]
    },
    
    // 3 blocs - 2 combinaisons
    piece3_1: {
        name: "Triomino I",
        blocks: 3,
        shape: [[1, 1, 1]]
    },
    piece3_2: {
        name: "Triomino L",
        blocks: 3,
        shape: [
            [1, 1],
            [1, 0]
        ]
    },
    
    // 4 blocs - 5 combinaisons
    piece4_1: {
        name: "Tetromino I",
        blocks: 4,
        shape: [[1, 1, 1, 1]]
    },
    piece4_2: {
        name: "Tetromino O",
        blocks: 4,
        shape: [
            [1, 1],
            [1, 1]
        ]
    },
    piece4_3: {
        name: "Tetromino T",
        blocks: 4,
        shape: [
            [1, 1, 1],
            [0, 1, 0]
        ]
    },
    piece4_4: {
        name: "Tetromino S",
        blocks: 4,
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },
    piece4_5: {
        name: "Tetromino L",
        blocks: 4,
        shape: [
            [1, 1, 1],
            [1, 0, 0]
        ]
    },
    
    // 5 blocs - 12 combinaisons
    piece5_1: {
        name: "Pentomino I",
        blocks: 5,
        shape: [[1, 1, 1, 1, 1]]
    },
    piece5_2: {
        name: "Pentomino L",
        blocks: 5,
        shape: [
            [1, 1, 1, 1],
            [1, 0, 0, 0]
        ]
    },
    piece5_3: {
        name: "Pentomino N",
        blocks: 5,
        shape: [
            [0, 1, 1, 1],
            [1, 1, 0, 0]
        ]
    },
    piece5_4: {
        name: "Pentomino P",
        blocks: 5,
        shape: [
            [1, 1, 1],
            [1, 1, 0]
        ]
    },
    piece5_5: {
        name: "Pentomino Y",
        blocks: 5,
        shape: [
            [0, 1, 0, 0],
            [1, 1, 1, 1]
        ]
    },
    piece5_6: {
        name: "Pentomino T",
        blocks: 5,
        shape: [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ]
    },
    piece5_7: {
        name: "Pentomino U",
        blocks: 5,
        shape: [
            [1, 0, 1],
            [1, 1, 1]
        ]
    },
    piece5_8: {
        name: "Pentomino V",
        blocks: 5,
        shape: [
            [1, 0, 0],
            [1, 0, 0],
            [1, 1, 1]
        ]
    },
    piece5_9: {
        name: "Pentomino W",
        blocks: 5,
        shape: [
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 1]
        ]
    },
    piece5_10: {
        name: "Pentomino X",
        blocks: 5,
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ]
    },
    piece5_11: {
        name: "Pentomino Z",
        blocks: 5,
        shape: [
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 1]
        ]
    },
    piece5_12: {
        name: "Pentomino F",
        blocks: 5,
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 1, 0]
        ]
    }
};

// Variables globales de jeu
let selectedPiece = null;
let currentRotation = 0;
let isFlipped = false;

// Système de joueurs
const PLAYERS = {
    1: { name: "BLEU", color: "blue", displayColor: "#2196F3" },
    2: { name: "Jaune", color: "yellow", displayColor: "#FFC107" },
    3: { name: "Rouge", color: "red", displayColor: "#F44336" },
    4: { name: "Vert", color: "green", displayColor: "#4CAF50" }
};

let currentPlayer = 1; // Joueur actuel (1-4)
let playedPieces = {
    1: [], // Pièces jouées par bleu
    2: [], // Pièces jouées par jaune
    3: [], // Pièces jouées par rouge
    4: []  // Pièces jouées par vert
};

// Historique des parties
let gameHistory = [];
let currentGameNumber = 1;
let cumulativeScores = { 1: 0, 2: 0, 3: 0, 4: 0 }; // Scores cumulés de chaque joueur

// Grille de jeu 20x20 pour suivre les pièces placées
let gameGrid = Array(20).fill().map(() => Array(20).fill(0));

// Fonctions de transformation des pièces
function rotatePiece(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = [];
    
    for (let j = 0; j < cols; j++) {
        rotated[j] = [];
        for (let i = rows - 1; i >= 0; i--) {
            rotated[j][rows - 1 - i] = shape[i][j];
        }
    }
    return rotated;
}

function flipPieceHorizontal(shape) {
    return shape.map(row => [...row].reverse());
}

function getCurrentPieceShape(pieceKey) {
    if (!pieceKey) return null;
    
    let shape = JSON.parse(JSON.stringify(PIECES[pieceKey].shape)); // Deep copy
    
    // Appliquer les rotations
    for (let i = 0; i < currentRotation; i++) {
        shape = rotatePiece(shape);
    }
    
    // Appliquer le retournement si nécessaire
    if (isFlipped) {
        shape = flipPieceHorizontal(shape);
    }
    
    return shape;
}

// Fonction pour afficher une pièce dans la zone de sélection
function displayPieceInSelection(shape) {
    const selectionTable = document.querySelector('.selection-table');
    const cells = selectionTable.querySelectorAll('td');
    
    // Vider toutes les cellules
    cells.forEach(cell => {
        cell.style.backgroundColor = '#fff';
        cell.textContent = '';
    });
    
    if (!shape) return;
    
    // Afficher la pièce avec la couleur du joueur actuel
    const playerColor = PLAYERS[currentPlayer].displayColor;
    
    // Afficher la pièce centrée dans la grille 5x5
    const startRow = Math.floor((5 - shape.length) / 2);
    const startCol = Math.floor((5 - shape[0].length) / 2);
    
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j] === 1) {
                const cellIndex = (startRow + i) * 5 + (startCol + j);
                if (cellIndex >= 0 && cellIndex < 25) {
                    cells[cellIndex].style.backgroundColor = playerColor;
                }
            }
        }
    }
}

// Fonction pour créer la liste des pièces
function createPiecesList() {
    const selectionArea = document.querySelector('.selection-area');
    
    // Créer l'ordre de passage (en premier)
    const turnOrder = document.createElement('div');
    turnOrder.className = 'turn-order';
    turnOrder.id = 'turn-order';
    
    // Créer l'affichage du joueur actuel
    const playerInfo = document.createElement('div');
    playerInfo.className = 'player-info';
    playerInfo.id = 'current-player-info';
    
    // Créer les contrôles pour la pièce sélectionnée
    const controls = document.createElement('div');
    controls.className = 'piece-controls';
    controls.innerHTML = `
        <div class="rotation-buttons">
            <button id="rotateLeftBtn">Rotation ↺ (G)</button>
            <button id="rotateRightBtn">Rotation ↻ (D)</button>
        </div>
        <button id="flipBtn">Retourner</button>
        <button id="resetBtn">Reset</button>
    `;
    
    // Créer la liste des pièces
    const piecesList = document.createElement('div');
    piecesList.className = 'pieces-list';
    piecesList.innerHTML = '<h4>Sélectionner une pièce :</h4>';
    piecesList.id = 'pieces-list-container';
    
    // Supprimer le h3 existant et le remplacer par l'ordre de passage
    const existingH3 = selectionArea.querySelector('h3');
    if (existingH3) {
        existingH3.remove();
    }
    
    // Insérer les éléments dans la zone de sélection
    selectionArea.insertBefore(turnOrder, selectionArea.firstChild);
    selectionArea.insertBefore(playerInfo, selectionArea.querySelector('.selection-table'));
    selectionArea.insertBefore(controls, selectionArea.querySelector('.selection-table').nextSibling);
    selectionArea.appendChild(piecesList);
    
    // Ajouter les événements pour les contrôles
    document.getElementById('rotateLeftBtn').onclick = () => {
        currentRotation = (currentRotation + 3) % 4; // +3 équivaut à -1 en modulo 4
        updatePieceDisplay();
    };
    
    document.getElementById('rotateRightBtn').onclick = () => {
        currentRotation = (currentRotation + 1) % 4;
        updatePieceDisplay();
    };
    
    document.getElementById('flipBtn').onclick = () => {
        isFlipped = !isFlipped;
        updatePieceDisplay();
    };
    
    document.getElementById('resetBtn').onclick = () => {
        currentRotation = 0;
        isFlipped = false;
        updatePieceDisplay();
    };
    
    // Initialiser l'affichage
    updatePlayerDisplay();
    updateTurnOrder();
    updatePiecesList();
}

function selectPiece(pieceKey) {
    // Vérifier si la pièce n'est pas déjà jouée
    if (playedPieces[currentPlayer].includes(pieceKey)) {
        alert('Cette pièce a déjà été jouée!');
        return;
    }
    
    selectedPiece = pieceKey;
    currentRotation = 0;
    isFlipped = false;
    
    // Mettre à jour l'apparence des boutons
    document.querySelectorAll('.piece-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Trouver et sélectionner le bouton correspondant
    const buttons = document.querySelectorAll('.piece-button');
    buttons.forEach(btn => {
        if (btn.textContent.includes(PIECES[pieceKey].name) && !btn.disabled) {
            btn.classList.add('selected');
        }
    });
    
    updatePieceDisplay();
}

function updatePieceDisplay() {
    const shape = getCurrentPieceShape(selectedPiece);
    displayPieceInSelection(shape);
}

// Fonctions pour la gestion des joueurs
function updatePlayerDisplay() {
    const playerInfo = document.getElementById('current-player-info');
    const player = PLAYERS[currentPlayer];
    playerInfo.innerHTML = `
        <h3 style="color: ${player.displayColor}; margin: 10px 0;">
            ${player.name}
        </h3>
        <div style="background-color: ${player.displayColor}; width: 30px; height: 30px; margin: 0 auto 10px; border-radius: 50%;"></div>
    `;
}

function updateTurnOrder() {
    const turnOrderContainer = document.getElementById('turn-order');
    turnOrderContainer.innerHTML = '';
    
    // Créer le label au-dessus
    const label = document.createElement('div');
    label.className = 'turn-order-label';
    label.textContent = 'Ordre de passage :';
    turnOrderContainer.appendChild(label);
    
    // Créer un conteneur pour les joueurs
    const playersContainer = document.createElement('div');
    playersContainer.className = 'turn-players-container';
    
    // Créer l'ordre de passage à partir du joueur actuel
    for (let i = 0; i < 4; i++) {
        const playerId = (currentPlayer - 1 + i) % 4 + 1;
        const player = PLAYERS[playerId];
        
        // Vérifier si le joueur est bloqué
        const originalPlayer = currentPlayer;
        currentPlayer = playerId;
        const playerBlocked = isBlocked();
        currentPlayer = originalPlayer;
        
        const playerDiv = document.createElement('div');
        playerDiv.className = 'turn-player';
        
        if (playerId === currentPlayer) {
            playerDiv.classList.add('current');
        }
        
        if (playerBlocked) {
            playerDiv.classList.add('blocked');
        }
        
        playerDiv.innerHTML = `
            <div class="turn-player-circle" style="background-color: ${player.displayColor};"></div>
            <div class="turn-player-name">${player.name.replace('Joueur ', 'J')}</div>
        `;
        
        playersContainer.appendChild(playerDiv);
    }
    
    turnOrderContainer.appendChild(playersContainer);
}

function updatePiecesList() {
    const piecesListContainer = document.getElementById('pieces-list-container');
    piecesListContainer.innerHTML = '<h4>Pièces disponibles :</h4>';
    
    const playedByCurrentPlayer = playedPieces[currentPlayer];
    
    Object.keys(PIECES).forEach(pieceKey => {
        const piece = PIECES[pieceKey];
        const button = document.createElement('button');
        button.className = 'piece-button';
        
        // Vérifier si la pièce a déjà été jouée par le joueur actuel
        const isPlayed = playedByCurrentPlayer.includes(pieceKey);
        
        if (isPlayed) {
            button.className += ' piece-played';
            button.textContent = `${piece.name} (JOUÉE)`;
            button.disabled = true;
        } else {
            button.textContent = `${piece.name} (${piece.blocks})`;
            button.onclick = () => selectPiece(pieceKey);
        }
        
        piecesListContainer.appendChild(button);
    });
}

function isEndGame() {
    // Vérifier si tous les joueurs sont bloqués
    for (let player = 1; player <= 4; player++) {
        const originalPlayer = currentPlayer;
        currentPlayer = player;
        
        const playerBlocked = isBlocked();
        
        currentPlayer = originalPlayer; // Restaurer le joueur actuel
        
        if (!playerBlocked) {
            return false; // Au moins un joueur peut encore jouer
        }
    }
    
    return true; // Tous les joueurs sont bloqués
}

function score() {
    const scores = {};
    let results = "";
    
    for (let player = 1; player <= 4; player++) {
        const playerName = PLAYERS[player].name;
        const playedPieceKeys = playedPieces[player];
        const allPieceKeys = Object.keys(PIECES);
        
        // Trouver les pièces non jouées
        const unplayedPieceKeys = allPieceKeys.filter(pieceKey => 
            !playedPieceKeys.includes(pieceKey)
        );
        
        // Calculer le score de base (somme des blocs non placés)
        let playerScore = 0;
        for (const pieceKey of unplayedPieceKeys) {
            playerScore += PIECES[pieceKey].blocks;
        }
        
        // Bonus si toutes les pièces ont été placées
        if (unplayedPieceKeys.length === 0) {
            playerScore -= 15; // Bonus de -15 pour avoir tout placé
            
            // Vérifier si la dernière pièce jouée était le Mono (1 bloc)
            const lastPlayedPiece = playedPieceKeys[playedPieceKeys.length - 1];
            if (lastPlayedPiece === 'piece1_1') { // piece1_1 est le Mono
                playerScore -= 5; // Bonus supplémentaire de -5 (total -20)
            }
        }
        
        scores[player] = playerScore;
    }
    
    // Déterminer le gagnant (score le plus bas)
    const sortedPlayers = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const winnerId = parseInt(sortedPlayers[0][0]);
    const winnerScore = sortedPlayers[0][1];
    const winnerName = PLAYERS[winnerId].name;
    
    // Sauvegarder cette partie dans l'historique
    const gameResult = {
        gameNumber: currentGameNumber,
        date: new Date().toLocaleString(),
        scores: { ...scores },
        winner: { id: winnerId, name: winnerName, score: winnerScore },
        sortedPlayers: sortedPlayers.map(entry => ({
            id: parseInt(entry[0]),
            name: PLAYERS[parseInt(entry[0])].name,
            score: entry[1]
        }))
    };
    
    gameHistory.push(gameResult);
    
    // Mettre à jour les scores cumulatifs
    for (let player = 1; player <= 4; player++) {
        cumulativeScores[player] += scores[player];
    }
    
    // Afficher l'écran de fin de partie avec les scores cumulatifs
    showGameOverScreen(sortedPlayers, winnerName, winnerScore);
    
    // Log de l'historique dans la console
    console.log("📊 HISTORIQUE DES PARTIES:");
    gameHistory.forEach((game, index) => {
        console.log(`Partie ${game.gameNumber} (${game.date}): ${game.winner.name} avec ${game.winner.score} points`);
    });
    
    // Afficher les scores cumulatifs
    console.log("\n🏆 SCORES CUMULATIFS:");
    const sortedCumulative = Object.entries(cumulativeScores).sort((a, b) => a[1] - b[1]);
    sortedCumulative.forEach((entry, index) => {
        const playerId = parseInt(entry[0]);
        const totalScore = entry[1];
        const playerName = PLAYERS[playerId].name;
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "4️⃣";
        console.log(`${medal} ${playerName}: ${totalScore} points totaux`);
    });
    
    return scores;
}

function showGameOverScreen(sortedPlayers, winnerName, winnerScore) {
    const gameOverDiv = document.getElementById('game-over');
    const winnerText = document.getElementById('winner-text');
    const scoresDisplay = document.getElementById('scores-display');
    
    // Texte du gagnant
    winnerText.textContent = `${winnerName} remporte la partie avec ${winnerScore} points !`;
    
    // Affichage des scores de cette partie ET des scores cumulatifs
    let scoresHTML = '';
    
    if (currentGameNumber > 1) {
        // Affichage côte à côte si ce n'est pas la première partie
        const sortedCumulative = Object.entries(cumulativeScores).sort((a, b) => a[1] - b[1]);
        const cumulativeWinnerId = parseInt(sortedCumulative[0][0]);
        
        scoresHTML += `
            <div style="display: flex; gap: 20px; justify-content: center;">
                <div style="flex: 1; max-width: 250px;">
                    <div style="margin-bottom: 15px; font-size: 1.6vw; color: #FFD700; text-align: center;">📊 Partie ${currentGameNumber}</div>
        `;
        
        sortedPlayers.forEach((entry, index) => {
            const playerId = parseInt(entry[0]);
            const playerScore = entry[1];
            const playerName = PLAYERS[playerId].name;
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "4️⃣";
            const isWinner = index === 0;
            
            scoresHTML += `
                <div class="score-item ${isWinner ? 'winner' : ''}" style="margin: 4px 0; padding: 5px 10px;">
                    <span class="player-score-name" style="font-size: 1.4vw;">${medal} ${playerName}</span>
                    <span class="player-score-points" style="font-size: 1.4vw;">${playerScore} pts</span>
                </div>
            `;
        });
        
        scoresHTML += `
                </div>
                <div style="flex: 1; max-width: 250px;">
                    <div style="margin-bottom: 15px; font-size: 1.6vw; color: #FFD700; text-align: center;">🏆 Totaux (${currentGameNumber} parties)</div>
        `;
        
        sortedCumulative.forEach((entry, index) => {
            const playerId = parseInt(entry[0]);
            const totalScore = entry[1];
            const playerName = PLAYERS[playerId].name;
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "4️⃣";
            const isOverallLeader = playerId === cumulativeWinnerId;
            
            scoresHTML += `
                <div class="score-item ${isOverallLeader ? 'winner' : ''}" style="background-color: rgba(255, 255, 255, 0.05); margin: 4px 0; padding: 5px 10px;">
                    <span class="player-score-name" style="font-size: 1.4vw;">${medal} ${playerName}</span>
                    <span class="player-score-points" style="font-size: 1.4vw;">${totalScore} pts</span>
                </div>
            `;
        });
        
        scoresHTML += `
                </div>
            </div>
        `;
    } else {
        // Affichage normal pour la première partie
        scoresHTML += `<div style="margin-bottom: 15px; font-size: 1.8vw; color: #FFD700; text-align: center;">📊 Partie ${currentGameNumber}</div>`;
        
        sortedPlayers.forEach((entry, index) => {
            const playerId = parseInt(entry[0]);
            const playerScore = entry[1];
            const playerName = PLAYERS[playerId].name;
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "4️⃣";
            const isWinner = index === 0;
            
            scoresHTML += `
                <div class="score-item ${isWinner ? 'winner' : ''}">
                    <span class="player-score-name">${medal} ${index + 1}. ${playerName}</span>
                    <span class="player-score-points">${playerScore} pts</span>
                </div>
            `;
        });
    }
    
    scoresDisplay.innerHTML = scoresHTML;
    
    // Afficher l'écran
    gameOverDiv.style.display = 'block';
    
    // Log dans la console pour les détails
    console.log("=== PARTIE TERMINÉE ===");
    console.log(`Gagnant: ${winnerName} avec ${winnerScore} points`);
    sortedPlayers.forEach((entry, index) => {
        const playerId = parseInt(entry[0]);
        const playerScore = entry[1];
        const playerName = PLAYERS[playerId].name;
        console.log(`${index + 1}. ${playerName}: ${playerScore} points`);
    });
}

function restartGame() {
    // Masquer l'écran de fin
    document.getElementById('game-over').style.display = 'none';
    
    // Incrémenter le numéro de partie
    currentGameNumber++;
    
    // Réinitialiser le jeu (SANS réinitialiser les scores cumulatifs et l'historique)
    gameGrid = Array(20).fill().map(() => Array(20).fill(0));
    playedPieces = { 1: [], 2: [], 3: [], 4: [] };
    currentPlayer = 1;
    selectedPiece = null;
    currentRotation = 0;
    isFlipped = false;
    
    // Réinitialiser l'affichage
    const gameTable = document.querySelector('.center-table');
    const cells = gameTable.querySelectorAll('td');
    cells.forEach(cell => {
        cell.style.backgroundColor = '#fff';
        cell.className = '';
    });
    
    // Réinitialiser l'interface
    initializeGameGrid();
    updatePlayerDisplay();
    updateTurnOrder();
    updatePiecesList();
    
    // Sélectionner la première pièce
    const firstAvailablePiece = Object.keys(PIECES).find(pieceKey => 
        !playedPieces[currentPlayer].includes(pieceKey)
    );
    if (firstAvailablePiece) {
        selectPiece(firstAvailablePiece);
    }
    
    console.log(`🎮 Nouvelle partie commencée ! (Partie ${currentGameNumber})`);
    console.log(`📈 Parties jouées: ${gameHistory.length}`);
    
    // Afficher les statistiques des victoires si il y a plusieurs parties
    if (gameHistory.length > 1) {
        const victories = {};
        gameHistory.forEach(game => {
            const winnerId = game.winner.id;
            victories[winnerId] = (victories[winnerId] || 0) + 1;
        });
        
        console.log("🏆 BILAN DES VICTOIRES:");
        for (let player = 1; player <= 4; player++) {
            const wins = victories[player] || 0;
            console.log(`${PLAYERS[player].name}: ${wins} victoire(s)`);
        }
    }
}

// Fonction pour afficher l'historique complet
function showGameHistory() {
    if (gameHistory.length === 0) {
        console.log("Aucune partie terminée encore.");
        return;
    }
    
    console.log("📋 HISTORIQUE COMPLET DES PARTIES:");
    console.log("=====================================");
    
    gameHistory.forEach((game, index) => {
        console.log(`\n🎮 PARTIE ${game.gameNumber} - ${game.date}`);
        console.log(`🏆 Gagnant: ${game.winner.name} (${game.winner.score} points)`);
        console.log("📊 Classement complet:");
        game.sortedPlayers.forEach((player, rank) => {
            const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : "4️⃣";
            console.log(`   ${medal} ${rank + 1}. ${player.name}: ${player.score} points`);
        });
    });
    
    // Statistiques globales
    const victories = {};
    const totalPoints = {};
    gameHistory.forEach(game => {
        const winnerId = game.winner.id;
        victories[winnerId] = (victories[winnerId] || 0) + 1;
        
        game.sortedPlayers.forEach(player => {
            totalPoints[player.id] = (totalPoints[player.id] || 0) + player.score;
        });
    });
    
    console.log("\n🏆 STATISTIQUES GLOBALES:");
    console.log("==========================");
    for (let player = 1; player <= 4; player++) {
        const wins = victories[player] || 0;
        const avgScore = gameHistory.length > 0 ? (totalPoints[player] || 0) / gameHistory.length : 0;
        console.log(`${PLAYERS[player].name}: ${wins} victoire(s), moyenne: ${avgScore.toFixed(1)} points`);
    }
}

// Fonction pour réinitialiser complètement toutes les données
function resetAllScores() {
    gameHistory = [];
    currentGameNumber = 1;
    cumulativeScores = { 1: 0, 2: 0, 3: 0, 4: 0 };
    console.log("🔄 Tous les scores et l'historique ont été réinitialisés !");
}

function isBlocked() {
    // Récupérer toutes les pièces non jouées par le joueur actuel
    const availablePieces = Object.keys(PIECES).filter(pieceKey => 
        !playedPieces[currentPlayer].includes(pieceKey)
    );
    
    // Si le joueur n'a plus de pièces, il est bloqué
    if (availablePieces.length === 0) {
        return true;
    }
    
    // Sauvegarder l'état actuel
    const originalPiece = selectedPiece;
    const originalRotation = currentRotation;
    const originalFlipped = isFlipped;
    
    // Pour chaque pièce disponible, tester toutes les orientations et positions
    for (const pieceKey of availablePieces) {
        // Temporairement sélectionner cette pièce pour les tests
        selectedPiece = pieceKey;
        
        // Tester toutes les rotations (0, 1, 2, 3)
        for (let rotation = 0; rotation < 4; rotation++) {
            currentRotation = rotation;
            
            // Tester retourné et non retourné
            for (let flipped = 0; flipped < 2; flipped++) {
                isFlipped = (flipped === 1);
                
                // Tester toutes les positions sur la grille 20x20
                for (let i = 0; i < 20; i++) {
                    for (let j = 0; j < 20; j++) {
                        if (isCorrectPlacement(i, j)) {
                            // Restaurer l'état original
                            selectedPiece = originalPiece;
                            currentRotation = originalRotation;
                            isFlipped = originalFlipped;
                            return false; // Le joueur peut jouer
                        }
                    }
                }
            }
        }
    }
    
    // Restaurer l'état original
    selectedPiece = originalPiece;
    currentRotation = originalRotation;
    isFlipped = originalFlipped;
    
    return true; // Aucune pièce ne peut être placée, joueur bloqué
}

function nextPlayer() {
    currentPlayer = (currentPlayer % 4) + 1;
    selectedPiece = null;
    currentRotation = 0;
    isFlipped = false;
    
    updatePlayerDisplay();
    updateTurnOrder();
    updatePiecesList();
    displayPieceInSelection(null);
    
    // Mettre à jour l'apparence des boutons
    document.querySelectorAll('.piece-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Vérifier si le nouveau joueur est bloqué
    if (isBlocked()) {
        console.log(`${PLAYERS[currentPlayer].name} est bloqué et passe automatiquement son tour.`);
        
        // Compter combien de joueurs consécutifs sont bloqués
        let blockedCount = 0;
        let testPlayer = currentPlayer;
        
        do {
            blockedCount++;
            testPlayer = (testPlayer % 4) + 1;
            
            // Temporairement changer de joueur pour tester
            const originalPlayer = currentPlayer;
            currentPlayer = testPlayer;
            const isTestPlayerBlocked = isBlocked();
            currentPlayer = originalPlayer; // Restaurer
            
            if (!isTestPlayerBlocked) {
                break; // On a trouvé un joueur qui peut jouer
            }
        } while (blockedCount < 4 && testPlayer !== currentPlayer);
        
        if (blockedCount >= 4) {
            // Tous les joueurs sont bloqués - fin de partie
            console.log("Fin de partie ! Tous les joueurs sont bloqués.");
            // L'affichage des scores sera géré par placePiece() via isEndGame()
            return;
        } else {
            // Passer automatiquement au prochain joueur non bloqué
            setTimeout(() => {
                nextPlayer(); // Récursion pour passer au suivant
            }, 1000); // Délai de 1 seconde pour voir le joueur bloqué
        }
    } else {
        // Sélectionner la première pièce disponible
        const firstAvailablePiece = Object.keys(PIECES).find(pieceKey => 
            !playedPieces[currentPlayer].includes(pieceKey)
        );
        if (firstAvailablePiece) {
            selectPiece(firstAvailablePiece);
        }
    }
}

function canPlacePieceBasic(shape, startRow, startCol) {
    if (!shape) return false;
    
    // Vérifier si la pièce sort de la grille
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j] === 1) {
                const row = startRow + i;
                const col = startCol + j;
                
                if (row < 0 || row >= 20 || col < 0 || col >= 20) {
                    return false;
                }
                
                // Vérifier si la case est déjà occupée
                if (gameGrid[row][col] !== 0) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Fonction à expliquer
function isCorrectPlacement(i, j) {
    if (!selectedPiece) return false;
    
    const shape = getCurrentPieceShape(selectedPiece);
    if (!shape) return false;
    
    // Centrer la pièce dans la grille 5x5 comme dans la prévisualisation
    const previewSize = 5;
    const halfSize = Math.floor(previewSize / 2);
    const pieceHeight = shape.length;
    const pieceWidth = shape[0].length;
    const pieceOffsetRow = Math.floor((previewSize - pieceHeight) / 2);
    const pieceOffsetCol = Math.floor((previewSize - pieceWidth) / 2);
    
    // Calculer la position de départ de la pièce
    const pieceStartRow = i - halfSize + pieceOffsetRow;
    const pieceStartCol = j - halfSize + pieceOffsetCol;
    
    // Vérification de base : la pièce peut-elle être placée physiquement ?
    if (!canPlacePieceBasic(shape, pieceStartRow, pieceStartCol)) {
        return false;
    }
    
    // Récupérer toutes les positions où la pièce sera placée
    const piecePositions = [];
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
                piecePositions.push({
                    row: pieceStartRow + row,
                    col: pieceStartCol + col
                });
            }
        }
    }
    
    // Vérifier si c'est le premier placement du joueur
    const isFirstPlacement = playedPieces[currentPlayer].length === 0;
    
    if (isFirstPlacement) {
        // Premier placement : doit être sur le coin correspondant au joueur
        const playerCorners = {
            1: { row: 0, col: 0 },     // Joueur 1 - coin haut-gauche
            2: { row: 0, col: 19 },    // Joueur 2 - coin haut-droite
            3: { row: 19, col: 0 },    // Joueur 3 - coin bas-gauche
            4: { row: 19, col: 19 }    // Joueur 4 - coin bas-droite
        };
        
        const playerCorner = playerCorners[currentPlayer];
        return piecePositions.some(pos => 
            pos.row === playerCorner.row && pos.col === playerCorner.col
        );
    } else {
        // Placements suivants : règles du Blokus
        let touchesCoinMemeJoueur = false;
        let toucheCoteMemeJoueur = false;
        
        // Vérifier TOUTES les positions de la pièce avant de prendre une décision
        for (const pos of piecePositions) {
            // Vérifier les côtés adjacents (haut, bas, gauche, droite)
            const adjacentPositions = [
                { row: pos.row - 1, col: pos.col },    // haut
                { row: pos.row + 1, col: pos.col },    // bas
                { row: pos.row, col: pos.col - 1 },    // gauche
                { row: pos.row, col: pos.col + 1 }     // droite
            ];
            
            for (const adjacent of adjacentPositions) {
                if (adjacent.row >= 0 && adjacent.row < 20 && 
                    adjacent.col >= 0 && adjacent.col < 20) {
                    if (gameGrid[adjacent.row][adjacent.col] === currentPlayer) {
                        toucheCoteMemeJoueur = true;
                        // Ne pas faire de break ici, continuer à vérifier toute la pièce
                    }
                }
            }
            
            // Vérifier les coins diagonaux
            const diagonalPositions = [
                { row: pos.row - 1, col: pos.col - 1 }, // haut-gauche
                { row: pos.row - 1, col: pos.col + 1 }, // haut-droite
                { row: pos.row + 1, col: pos.col - 1 }, // bas-gauche
                { row: pos.row + 1, col: pos.col + 1 }  // bas-droite
            ];
            
            for (const diagonal of diagonalPositions) {
                if (diagonal.row >= 0 && diagonal.row < 20 && 
                    diagonal.col >= 0 && diagonal.col < 20) {
                    if (gameGrid[diagonal.row][diagonal.col] === currentPlayer) {
                        touchesCoinMemeJoueur = true;
                        // Ne pas faire de break ici non plus
                    }
                }
            }
        }
        
        // Placement valide si : touche au moins un coin de sa couleur ET ne touche aucun côté de sa couleur
        return touchesCoinMemeJoueur && !toucheCoteMemeJoueur;
    }
}

function placePiece(i, j) {
    if (!isCorrectPlacement(i, j)) {
        return false;
    }
    
    const shape = getCurrentPieceShape(selectedPiece);
    const playerColor = PLAYERS[currentPlayer].displayColor;
    const gameTable = document.querySelector('.center-table');
    
    // Centrer la pièce dans la grille 5x5 comme dans la prévisualisation
    const previewSize = 5;
    const halfSize = Math.floor(previewSize / 2);
    const pieceHeight = shape.length;
    const pieceWidth = shape[0].length;
    const pieceOffsetRow = Math.floor((previewSize - pieceHeight) / 2);
    const pieceOffsetCol = Math.floor((previewSize - pieceWidth) / 2);
    
    // Calculer la position de départ de la pièce
    const pieceStartRow = i - halfSize + pieceOffsetRow;
    const pieceStartCol = j - halfSize + pieceOffsetCol;
    
    // Placer la pièce sur la grille logique et visuelle
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
                const gridRow = pieceStartRow + row;
                const gridCol = pieceStartCol + col;
                
                // Mettre à jour la grille logique
                gameGrid[gridRow][gridCol] = currentPlayer;
                
                // Mettre à jour la grille visuelle
                const cellIndex = gridRow * 20 + gridCol;
                const cell = gameTable.querySelectorAll('td')[cellIndex];
                cell.style.backgroundColor = playerColor;
            }
        }
    }
    
    // Marquer la pièce comme jouée
    playedPieces[currentPlayer].push(selectedPiece);
    
    // Passer automatiquement au joueur suivant
    nextPlayer();
    
    // Vérifier si c'est la fin de partie après le changement de joueur
    if (isEndGame()) {
        console.log("Fin de partie ! Tous les joueurs sont bloqués.");
        setTimeout(() => {
            score(); // Afficher les scores finaux avec un délai
        }, 1500);
    }
    
    return true;
}

// Fonctions de prévisualisation
function showPreview(centerRow, centerCol) {
    if (!selectedPiece) return;
    
    const shape = getCurrentPieceShape(selectedPiece);
    if (!shape) return;
    
    // Calculer les positions pour une grille 5x5 centrée sur la position du curseur
    const previewSize = 5;
    const halfSize = Math.floor(previewSize / 2);
    
    const gameTable = document.querySelector('.center-table');
    const cells = gameTable.querySelectorAll('td');
    
    // Centrer la pièce dans la grille 5x5 de prévisualisation
    const pieceHeight = shape.length;
    const pieceWidth = shape[0].length;
    const pieceOffsetRow = Math.floor((previewSize - pieceHeight) / 2);
    const pieceOffsetCol = Math.floor((previewSize - pieceWidth) / 2);
    
    // Afficher la grille 5x5 de prévisualisation
    for (let i = -halfSize; i <= halfSize; i++) {
        for (let j = -halfSize; j <= halfSize; j++) {
            const targetRow = centerRow + i;
            const targetCol = centerCol + j;
            
            if (targetRow >= 0 && targetRow < 20 && targetCol >= 0 && targetCol < 20) {
                const cellIndex = targetRow * 20 + targetCol;
                const cell = cells[cellIndex];
                
                // Coordonnées dans la grille 5x5 (0 à 4)
                const gridRow = i + halfSize;
                const gridCol = j + halfSize;
                
                // Vérifier si cette position fait partie de la pièce centrée
                const shapeRow = gridRow - pieceOffsetRow;
                const shapeCol = gridCol - pieceOffsetCol;
                const isPieceCell = (
                    shapeRow >= 0 && shapeRow < pieceHeight &&
                    shapeCol >= 0 && shapeCol < pieceWidth &&
                    shape[shapeRow][shapeCol] === 1
                );
                
                // Case du centre (repère)
                if (i === 0 && j === 0) {
                    cell.classList.add('preview-center');
                    if (isPieceCell) {
                        cell.classList.add('preview-piece');
                    }
                } else {
                    // Cases de la grille 5x5
                    cell.classList.add('preview-light');
                    if (isPieceCell) {
                        cell.classList.add('preview-piece');
                    }
                }
            }
        }
    }
}

function clearPreview() {
    const gameTable = document.querySelector('.center-table');
    const cells = gameTable.querySelectorAll('td');
    
    cells.forEach(cell => {
        cell.classList.remove('preview-light', 'preview-center', 'preview-piece');
    });
}

function showErrorPreview(centerRow, centerCol) {
    if (!selectedPiece) return;
    
    const shape = getCurrentPieceShape(selectedPiece);
    if (!shape) return;
    
    // Calculer les positions pour une grille 5x5 centrée sur la position du curseur
    const previewSize = 5;
    const halfSize = Math.floor(previewSize / 2);
    
    const gameTable = document.querySelector('.center-table');
    const cells = gameTable.querySelectorAll('td');
    
    // Centrer la pièce dans la grille 5x5 de prévisualisation
    const pieceHeight = shape.length;
    const pieceWidth = shape[0].length;
    const pieceOffsetRow = Math.floor((previewSize - pieceHeight) / 2);
    const pieceOffsetCol = Math.floor((previewSize - pieceWidth) / 2);
    
    // Afficher la grille 5x5 de prévisualisation en rouge
    for (let i = -halfSize; i <= halfSize; i++) {
        for (let j = -halfSize; j <= halfSize; j++) {
            const targetRow = centerRow + i;
            const targetCol = centerCol + j;
            
            if (targetRow >= 0 && targetRow < 20 && targetCol >= 0 && targetCol < 20) {
                const cellIndex = targetRow * 20 + targetCol;
                const cell = cells[cellIndex];
                
                // Coordonnées dans la grille 5x5 (0 à 4)
                const gridRow = i + halfSize;
                const gridCol = j + halfSize;
                
                // Vérifier si cette position fait partie de la pièce centrée
                const shapeRow = gridRow - pieceOffsetRow;
                const shapeCol = gridCol - pieceOffsetCol;
                const isPieceCell = (
                    shapeRow >= 0 && shapeRow < pieceHeight &&
                    shapeCol >= 0 && shapeCol < pieceWidth &&
                    shape[shapeRow][shapeCol] === 1
                );
                
                if (isPieceCell) {
                    cell.classList.add('preview-error');
                }
            }
        }
    }
    
    // Enlever l'effet rouge après 300ms
    setTimeout(() => {
        cells.forEach(cell => {
            cell.classList.remove('preview-error');
        });
    }, 300);
}

function initializeGameGrid() {
    const gameTable = document.querySelector('.center-table');
    const cells = gameTable.querySelectorAll('td');
    
    // Colorer les 4 coins avec les couleurs des joueurs (opacité 50%)
    const corners = [
        { row: 0, col: 0, player: 1 },     // Coin haut-gauche - Joueur 1 (bleu)
        { row: 0, col: 19, player: 2 },    // Coin haut-droite - Joueur 2 (jaune)
        { row: 19, col: 0, player: 3 },    // Coin bas-gauche - Joueur 3 (rouge)
        { row: 19, col: 19, player: 4 }    // Coin bas-droite - Joueur 4 (vert)
    ];
    
    corners.forEach(corner => {
        const cellIndex = corner.row * 20 + corner.col;
        const cell = cells[cellIndex];
        const playerColor = PLAYERS[corner.player].displayColor;
        
        // Appliquer la couleur avec 50% d'opacité
        cell.style.backgroundColor = playerColor + '80'; // Ajouter '80' pour 50% d'opacité en hex
        cell.classList.add('starting-corner');
        cell.setAttribute('data-player', corner.player);
    });
    
    cells.forEach((cell, index) => {
        const row = Math.floor(index / 20);
        const col = index % 20;
        
        // Événement de survol pour la prévisualisation
        cell.onmouseenter = () => {
            clearPreview();
            showPreview(row, col);
        };
        
        // Événement de sortie de survol
        cell.onmouseleave = () => {
            clearPreview();
        };
        
        cell.onclick = () => {
            if (selectedPiece) {
                const shape = getCurrentPieceShape(selectedPiece);
                
                // Centrer la pièce dans la grille 5x5 comme dans la prévisualisation
                const previewSize = 5;
                const halfSize = Math.floor(previewSize / 2);
                const pieceHeight = shape.length;
                const pieceWidth = shape[0].length;
                const pieceOffsetRow = Math.floor((previewSize - pieceHeight) / 2);
                const pieceOffsetCol = Math.floor((previewSize - pieceWidth) / 2);
                
                // Calculer la position de départ de la pièce
                const pieceStartRow = row - halfSize + pieceOffsetRow;
                const pieceStartCol = col - halfSize + pieceOffsetCol;
                
                if (placePiece(row, col)) {
                    // Le message est maintenant géré dans placePiece()
                } else {
                    // Afficher un effet rouge au lieu d'une alerte
                    showErrorPreview(row, col);
                }
            } 
        };
    });
    
    // Événement pour effacer la prévisualisation quand on quitte la table
    gameTable.onmouseleave = () => {
        clearPreview();
    };
}

// Initialiser le système de pièces au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    createPiecesList();
    initializeGameGrid();
    
    // Sélectionner la première pièce par défaut si disponible
    const firstAvailablePiece = Object.keys(PIECES).find(pieceKey => 
        !playedPieces[currentPlayer].includes(pieceKey)
    );
    if (firstAvailablePiece) {
        selectPiece(firstAvailablePiece);
    }
    
    // Ajouter les raccourcis clavier
    document.addEventListener('keydown', function(event) {
        // Vérifier qu'on n'est pas en train de saisir dans un champ de texte
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // G pour rotation à gauche
        if (event.key.toLowerCase() === 'g') {
            event.preventDefault();
            if (selectedPiece) {
                currentRotation = (currentRotation + 3) % 4; // +3 équivaut à -1 en modulo 4
                updatePieceDisplay();
            }
        }
        
        // D pour rotation à droite
        if (event.key.toLowerCase() === 'd') {
            event.preventDefault();
            if (selectedPiece) {
                currentRotation = (currentRotation + 1) % 4;
                updatePieceDisplay();
            }
        }
    });
    
    // Rendre la fonction showGameHistory accessible globalement
    window.showGameHistory = showGameHistory;
    window.resetAllScores = resetAllScores;
});