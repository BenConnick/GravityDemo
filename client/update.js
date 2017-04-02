//when we receive a character update
const update = (data) => {
  //if we do not have that character (based on their id)
  //then add them
  if(!squares[data.hash]) {
    squares[data.hash] = data;
    return;
  }

  //if the update is for our own character (we dont need it)
  //Although, it could be used for player validation
  if(data.hash === hash) {
    //return; now we are listening for our own update
  }

  //if we received an old message, just drop it
  if(squares[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  //grab the character based on the character id we received
  const square = squares[data.hash];
  //update their direction and movement information
  //but NOT their x/y since we are animating those
  square.prevX = data.prevX;
  square.prevY = data.prevY;
  square.x = data.destX;
  square.y = data.destY;
  square.vx = data.vx;
  square.vy = data.vy;
  square.direction = data.direction;
  square.moveLeft = data.moveLeft;
  square.moveRight = data.moveRight;
  square.moveDown = data.moveDown;
  square.moveUp = data.moveUp;
  square.alpha = 0.05;
};

//function to remove a character from our character list
const removeUser = (data) => {
  //if we have that character, remove them
  if(squares[data.hash]) {
    delete squares[data.hash];
  }
};

//function to set this user's character
const setUser = (data) => {
  hash = data.hash; //set this user's hash to the unique one they received
  squares[hash] = data; //set the character by their hash
  requestAnimationFrame(redraw); //start animating
};

//when receiving an attack (cosmetic, not collision event)
//add it to our attacks to draw
const receiveAttack = (data) => {
  attacks.push(data);
};

//function to send an attack request to the server
const sendAttack = () => {
  const square = squares[hash];
  
  //create a new attack in a certain direction for this user
  const attack = {
    hash: hash,
    x: square.x,
    y: square.y,
    direction: square.direction,
    frames: 0,
  }
  
  //send request to server
  socket.emit('attack', attack);
};

//when a character is killed
const playerDeath = (data) => {
  //remove the character
  delete squares[data];
  
  //if the character killed is our character
  //then disconnect and draw a game over screen
  if(data === hash) {
    socket.disconnect();
    cancelAnimationFrame(animationFrame);
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = 'white';
    ctx.font = '48px serif';
    ctx.fillText('You died', 50, 100);
  }
};

//update this user's positions based on keyboard input
const updatePosition = () => {
  const square = squares[hash];
  
  // handle position change on server

  //determine direction based on the inputs of direction keys
  if(square.moveUp && square.moveLeft) square.direction = directions.UPLEFT;

  if(square.moveUp && square.moveRight) square.direction = directions.UPRIGHT;

  if(square.moveDown && square.moveLeft) square.direction = directions.DOWNLEFT;

  if(square.moveDown && square.moveRight) square.direction = directions.DOWNRIGHT;

  if(square.moveLeft && !(square.moveUp || square.moveDown || square.moveRight)) square.direction = directions.LEFT;

  if(square.moveRight && !(square.moveUp || square.moveDown || square.moveLeft)) square.direction = directions.RIGHT;
  
  if(square.moveDown && !(square.moveRight || square.moveLeft)) square.direction = directions.DOWN;

  if(square.moveUp && !(square.moveRight || square.moveLeft)) square.direction = directions.UP;

  //reset this character's alpha so they are always smoothly animating
  square.alpha = 0.05;

  //send the updated movement request to the server to validate the movement.
  socket.emit('movementUpdate', square);
};