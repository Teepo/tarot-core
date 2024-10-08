import { Turn } from './turn';
import { Card } from './card';

export class Player {

    id         : number;
    login      : string;
    customData : Object;

    scores       : Array<number>;
    cards        : Array<Card>;
    gameType     : String | null;
    currentCard! : Card | null;
    
    isCPU        : boolean;

    constructor({ id, login, isCPU = false }: { id: number, login: string, isCPU: boolean }) {

        this.id      = id;
        this.login   = login;

        this.scores = [];
        this.cards  = [];
        this.gameType = null;

        this.isCPU = isCPU;

        this.customData = {
            avatar : ''
        };
    }

    getId() : number {
        return this.id;
    }

    addScore(points : number) {
        this.scores.push(points);
    }

    getScores() : Array<number> {
        return this.scores;
    }

    getTotalScore() : number {

        if (this.scores.length <= 0) {
            return 0;
        }

        return this.scores.reduce((x, score) => {
            return x += score;
        });
    }

    increaseLastScore(points : number) {
        this.scores[this.scores.length -1] += points;
    }

    getCurrentCard() : Card | null {
        return this.currentCard;
    }

    setCurrentCard(card: Card | null) {
        this.currentCard = card;
    }

    addCards(cards: Array<Card>) {

        cards.map(card => {
            this.cards.push(card);
        });
    }

    setCards(cards: Array<Card>) {
        this.cards = cards;

        // On s'assure que les Cards nous sont attribués
        cards.map(card => {
            card.setPlayerId(this.getId());
        });
    }

    removeCard(card: Card) {
        this.cards = this.cards.filter(c => c.getIndex() !== card.getIndex());
    }

    getCards() : Array<Card> {
        return this.cards;
    }

    hasAllKingCards() : Boolean {
        return this.getCards().filter(card => card.isKing()).length >= 4;
    }

    hasAllQueenCards() : Boolean {
        return this.getCards().filter(card => card.isQueen()).length >= 4;
    }

    hasAllKnightCards() : Boolean {
        return this.getCards().filter(card => card.isKnight()).length >= 4;
    }

    hasAllJackCards() : Boolean {
        return this.getCards().filter(card => card.isJack()).length >= 4;
    }

    hasCardOfThisSignInHisDeck(sign : string) : Boolean {
        return this.getCards().some(card => card.getSign() === sign);
    }

    hasCardAtoutInHisCards() : Boolean {
        return this.getCards().some(card => card.isAtout());
    }

    hasCardFigureInHisCards() : Boolean {
        return this.getCards().some(card => card.isFigure());
    }

    hasBiggestCardComparedToPreviousCards(cards: Array<Card>) : Boolean {

        // Pas de carte joué avant
        // On peut jouer ce qu'on veut
        if (cards.length <= 0) {
            return true;
        }

        const biggestPreviousCard = cards.reduce((bigger, card) => card.value > bigger.value ? card : bigger);

        return this.getCards().filter(card => {
            return card.isAtout() && card.getValue() >= biggestPreviousCard.getValue()
        }).length > 0;
    }

    pickRandomValidCardInHisDeck(turn: Turn) : Card {

        const previousCards = turn.getCards();

        // Aucune carte n'a encore été joué dans ce tour.
        // On peut jouer ce qu'on veut.
        if (previousCards.length <= 0) {
            return this.getRandomWeakestCard();
        }

        return this.getWeakestPossibleCard(previousCards);
    }

    getWeakestPossibleCard(previousCards: Array<Card>) : Card {

        const firstPreviousCard = previousCards[0];

        const sign = firstPreviousCard.getSign();

        // La premiere Card est l'excuse,
        // On peut jouer n'importe quelle Card
        if (firstPreviousCard.isExcuse()) {
            return this.getRandomWeakestCard();
        }

        const lastPlayedCard = previousCards[previousCards.length - 1];

        // Trouver la carte avec le bon sign et la valeur la plus basse au-dessus de x
        const cardsWithGoodSignAbove = !firstPreviousCard.isAtout() ? this.getCards().filter(card => card.sign === sign && card.value > lastPlayedCard.value) : [];
        if (cardsWithGoodSignAbove.length > 0) {
            return cardsWithGoodSignAbove.reduce((lowest, card) => card.value < lowest.value ? card : lowest);
        }

        // On a pas de carte du même sign au dessus
        // On cherche quand même si y a pas le même sign peu importe la valeur
        const cardsWithGoodSign = !firstPreviousCard.isAtout() ? this.getCards().find(card => card.sign === sign) : false;
        if (cardsWithGoodSign) {
            return cardsWithGoodSign;
        }

        // Si aucun, chercher les cartes avec le sign 'A'
        // avec une valeur au-dessus de la plus grosse carte atout déjà joué
        const biggestAtoutInPreviousCards = previousCards.filter(card => card.isAtout());
        const biggestAtoutValueInPreviousCards = biggestAtoutInPreviousCards.length > 0
        ? biggestAtoutInPreviousCards.reduce((bigger, card) => card.value > bigger.value ? card : bigger).value : 0;

        const lowestPossibleCardAtout = this.getCards().filter(card => card.sign === 'A' && card.value > biggestAtoutValueInPreviousCards);
        if (lowestPossibleCardAtout.length > 0) {
            return lowestPossibleCardAtout.reduce((lowest, card) => card.value < lowest.value ? card : lowest);
        }

        // Si aucun, chercher les cartes avec le sign 'A' sans condition sur x
        const lowestCardAtout = this.getCards().filter(card => card.sign === 'A');
        if (lowestCardAtout.length > 0) {
            return lowestCardAtout.reduce((lowest, card) => card.value < lowest.value ? card : lowest);
        }

        // Étape 4 : Si aucun, prendre la carte la plus faible parmi toutes
        return this.getCards().reduce((lowest, card) => card.value < lowest.value ? card : lowest);
    }

    getRandomWeakestCard() : Card {
        return this.getCards().reduce((lowest, card) => card.value < lowest.value ? card : lowest);
    }

    getCardsOrderBySignAndValue() : Array<Card> {

        return this.getCards().sort((a, b) => {
            if (a.sign === b.sign) {
                return a.value - b.value;
            }
            return a.sign.localeCompare(b.sign);
        });
    }

    getCardsAtout() : Array<Card> {
        return this.getCards().filter(card => card.isAtout());
    }

    hasPetitSec() : Boolean {

        const cardsAtout: Array<Card> = this.getCards().filter(card => card.sign === 'A');

        if (cardsAtout.length !== 1) {
            return false;
        }

        if (cardsAtout[0].isPetit()) {
            return true;
        }

        return false;
    }

    haveMisere() : Boolean {
        return !this.hasCardAtoutInHisCards() || !this.hasCardFigureInHisCards();
    }

    havePoignee() : Boolean {
        return this.getCardsAtout().length >= 8;
    }

    haveSimplePoignee() : Boolean {
        return this.havePoignee();
    }

    haveDoublePoignee() : Boolean {
        return this.getCardsAtout().length >= 10;
    }

    haveTriplePoignee() : Boolean {
        return this.getCardsAtout().length >= 12;
    }
}
