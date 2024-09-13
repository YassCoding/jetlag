import { Actor, BoxBody, CircleBody, FilledBox, FilledCircle, FilledPolygon, GridSystem, Hero, JetLagGameConfig, KeyCodes, ManualMovement, Obstacle, PolygonBody, initializeAndLaunch, stage } from "../jetlag";
import { InputBox, TextSprite } from "../jetlag/Components/Appearance";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  // Use 16/9 for a game in landscape mode, and 9/16 for a game in portrait mode
  aspectRatio = { width: 16, height: 9 };
  // Make this `false` when you're done debugging your game and are ready to
  // share it with the world.
  hitBoxes = true;
}

/**
 * This function draws the first scene that shows when the game starts.  In this
 * code, it's an interactive world that cannot be won or lost.  After your game
 * starts becoming more polished, you will probably want to use several
 * functions like this one as a way to organize the parts of your game (levels,
 * chooser, welcome screen, store, etc).
 *
 * @param level Which level of the game should be displayed
 */
function builder(_level: number) {
  let z = new Actor({
        appearance: new InputBox({background: new FilledBox({width:10, height: 4, fillColor: "#000000"}),textFace: "Arial", align: "right", textColor: "#FF0000",textSize: 1, placeholder:"Text ehre", maxLength: 100, }),
        rigidBody: new BoxBody({width: 10, height: 4, cx: 8, cy: 4.5})
      });
      let fps = new Actor({
        appearance: new TextSprite({center:true, face: "Arial", color:"#000000", size: 50}, () => "FPS: " + stage.renderer.getFPS().toString()),
        rigidBody: new BoxBody({width: 10, height: 4, cx: 4, cy: 1})
      })
}

// call the function that starts running the game in the `game-player` div tag
// of `index.html`
initializeAndLaunch("game-player", new Config(), builder);
