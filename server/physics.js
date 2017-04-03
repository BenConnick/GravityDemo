// our socket code for physics to send updates back
const sockets = require('./sockets.js');

let charList = {}; // list of characters
const attacks = []; // array of attack to handle

// box collision check between two rectangles
// of a set width/height
const checkCollisions = (rect1, rect2, width, height) => {
  if (rect1.x < rect2.x + width &&
     rect1.x + width > rect2.x &&
     rect1.y < rect2.y + height &&
     height + rect1.y > rect2.y) {
    return true; // is colliding
  }
  return false; // is not colliding
};

// check attack collisions to see if colliding with the
// user themselves and return false so users cannot damage
// themselves
const checkAttackCollision = (character, attackObj) => {
  const attack = attackObj;

  // if attacking themselves, we won't check collision
  if (character.hash === attack.hash) {
    return false;
  }

  // otherwise check collision of user rect and attack rect
  return checkCollisions(character, attack, attack.width, attack.height);
};

const addGravity = (c) => {
  const character = c;
  character.vy += 1;
};

const updatePosition = (c) => {
  const character = c;
  character.destY = character.prevY + character.vy;
  character.destX = character.prevX + character.vx;
};

const clampPosToBounds = (c) => {
  const character = c;
  // if user is moving up, decrease y
  if (character.destY < 0) {
    character.destY = 0;
  }
  // if user is moving down, increase y
  if (character.destY > 400) {
    character.destY = 400;
  }
  // if user is moving left, decrease x
  if (character.destX < 0) {
    character.destX = 0;
  }
  // if user is moving right, increase x
  if (character.destX > 400) {
    character.destX = 400;
  }
};

const movePlayer = (hash) => {
  const square = charList[hash];

  if (!square) return;

  // move the last x/y to our previous x/y variables
  square.prevX = square.x;
  square.prevY = square.y;

  // if user is jumping, add jump force
  if (square.moveUp && square.vy >= 0) {
    square.vy = -10;
  }
  // if user is moving down, ignore
  if (square.moveDown) {
    // square.vy = 2; let gravity handle it
  }
  // if user is moving left, decrease x velocity
  if (square.moveLeft) {
    square.vx = -5;
  }
  // if user is moving right, increase x velocity
  if (square.moveRight) {
    square.vx = 5;
  }

  if (!square.moveRight && !square.moveLeft) {
    square.vx = 0;
  }

  addGravity(square);

  // add velocity with dt to get desired position
  updatePosition(square);

  // keep the character in bounds
  clampPosToBounds(square);
};

// handle each attack and calculate collisions
const checkAttacks = () => {
  // if we have attack
  if (attacks.length > 0) {
    // get all characters
    const keys = Object.keys(charList);
    const characters = charList;

    // for each attack
    for (let i = 0; i < attacks.length; i += 1) {
      // for each character
      for (let k = 0; k < keys.length; k += 1) {
        const char1 = characters[keys[k]];

        // call to see if the attack and character hit
        const hit = checkAttackCollision(char1, attacks[i]);

        if (hit) { // if a hit
          // ask sockets to notify users which character was hit
          sockets.handleAttack(char1.hash);
          // kill that character and remove from our user list
          delete charList[char1.hash];
        } else {
          // if not a hit
          console.log('miss');
        }
      }

      // once the attack has been calculated again all users
      // remove this attack and move onto the next one
      attacks.splice(i);
      // decrease i since our splice changes the array length
      i -= 1;
    }
  }
};

// update our entire character list
const setCharacterList = (characterList) => {
  charList = characterList;
};

// update an individual character
const setCharacter = (character) => {
  charList[character.hash] = character;
};

// add a new attack to calculate physics on
const addAttack = (attack) => {
  attacks.push(attack);
};

// check for collisions every 20ms
setInterval(() => {
  checkAttacks();
}, 20);

module.exports.setCharacterList = setCharacterList;
module.exports.setCharacter = setCharacter;
module.exports.addAttack = addAttack;
module.exports.movePlayer = movePlayer;
