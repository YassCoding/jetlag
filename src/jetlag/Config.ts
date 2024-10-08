import { Scene } from "./Entities/Scene";
import { Sprite } from "./Services/ImageLibrary";
import { stage } from "./Stage";
import { Actor } from "./Entities/Actor";
import { AccelerometerMode } from "./Devices/Accelerometer";
import { PixiSprite } from "../jetlag";

/**
 * The different ActorState combinations for which we might have an animation
 *
 * NB:  JetLag supports a broad set of possible states.  In many games, most of
 *      these won't be useful.
 */
export const enum AnimationState {
  // Stationary
  IDLE_N, IDLE_NE, IDLE_E, IDLE_SE, IDLE_S, IDLE_SW, IDLE_W, IDLE_NW,
  // Moving
  WALK_N, WALK_NE, WALK_E, WALK_SE, WALK_S, WALK_SW, WALK_W, WALK_NW,
  // Stationary + Tossing
  TOSS_IDLE_N, TOSS_IDLE_NE, TOSS_IDLE_E, TOSS_IDLE_SE, TOSS_IDLE_S, TOSS_IDLE_SW, TOSS_IDLE_W, TOSS_IDLE_NW,
  // Moving + Tossing
  TOSS_N, TOSS_NE, TOSS_E, TOSS_SE, TOSS_S, TOSS_SW, TOSS_W, TOSS_NW,
  // Stationary + Invincible
  INV_IDLE_N, INV_IDLE_NE, INV_IDLE_E, INV_IDLE_SE, INV_IDLE_S, INV_IDLE_SW, INV_IDLE_W, INV_IDLE_NW,
  // Moving + Invincible
  INV_N, INV_NE, INV_E, INV_SE, INV_S, INV_SW, INV_W, INV_NW,
  // Stationary + Jumping
  JUMP_IDLE_N, JUMP_IDLE_NE, JUMP_IDLE_E, JUMP_IDLE_SE, JUMP_IDLE_S, JUMP_IDLE_SW, JUMP_IDLE_W, JUMP_IDLE_NW,
  // Moving + Jumping
  JUMP_N, JUMP_NE, JUMP_E, JUMP_SE, JUMP_S, JUMP_SW, JUMP_W, JUMP_NW,
  // Stationary + Crawling
  CRAWL_IDLE_N, CRAWL_IDLE_NE, CRAWL_IDLE_E, CRAWL_IDLE_SE, CRAWL_IDLE_S, CRAWL_IDLE_SW, CRAWL_IDLE_W, CRAWL_IDLE_NW,
  // Moving + Crawling
  CRAWL_N, CRAWL_NE, CRAWL_E, CRAWL_SE, CRAWL_S, CRAWL_SW, CRAWL_W, CRAWL_NW,
}

/**
 * AnimationSequence describes a set of images that can be cycled through, in
 * order to achieve an animation effect.  We associate a time (in milliseconds)
 * with each image, and also allow the animation to loop.
 */
export class AnimationSequence {
  /**
   * A set of images that can be used as frames of an animation, along with
   * their durations
   */
  public steps: { cell: Sprite, duration: number }[] = [];

  /**
   * Create the shell of an animation.  Once the shell is created, use "to()" to
   * add steps to the animation.
   *
   * @param loop  Should the animation repeat?
   */
  constructor(readonly loop: boolean) { }

  /** Return the duration of the entire animation sequence */
  getDuration(): number {
    let result = 0;
    for (let l of this.steps) result += l.duration;
    return result;
  }

  /** Make a clone of this animation */
  public clone() {
    let a = new AnimationSequence(this.loop);
    for (let s of this.steps) {
      if (s.cell.imgName !== "") {
        a.steps.push({
          cell: stage.imageLibrary.getSprite(s.cell.imgName),
          duration: s.duration
        });
      }
      else {
        a.steps.push({
          cell: new Sprite("", s.cell.sprite),
          duration: s.duration
        })
      }
    }
    return a;
  }

  /**
   * Add a step to an animation
   *
   * @param imgName  The name of the image to add to the animation
   * @param duration The time in milliseconds that this image should be shown
   *
   * @return         The Animation, so that we can chain calls to "to()"
   */
  public to(imgName: string | PixiSprite, duration: number): AnimationSequence {
    if (typeof imgName === "string")
      this.steps.push({ cell: stage.imageLibrary.getSprite(imgName), duration });
    else
      this.steps.push({ cell: new Sprite("", imgName), duration });
    return this;
  }

  /**
   * Create a "simple" animation (i.e., one that shows each of a set of images
   * for the same amount of time)
   *
   * @param cfg.timePerFrame  The time to show each image, in milliseconds
   * @param cfg.repeat        True if the animation should repeat when it
   *                          reaches the end
   * @param cfg.images        The names of the images that comprise the
   *                          animation
   *
   * @return The animation
   */
  static makeSimple(cfg: { timePerFrame: number, repeat: boolean, images: (string | PixiSprite)[] }) {
    let a = new AnimationSequence(cfg.repeat);
    cfg.images.forEach((i) => a.to(i, cfg.timePerFrame));
    return a;
  }
}

/**
 * GestureHandlers is the means by which a programmer can attach to an Entity
 * code to run in response to each of the gestures that JetLag supports.
 */
export class GestureHandlers {
  /** code to run when this actor is tapped */
  public tap?: (actor: Actor, worldCoords: { x: number, y: number }) => boolean;
  /** code to run on a pan start event */
  public panStart?: (actor: Actor, worldCoords: { x: number, y: number }) => boolean;
  /** code to run on a pan move event */
  public panMove?: (actor: Actor, worldCoords: { x: number, y: number }) => boolean;
  /** code to run on a pan stop event */
  public panStop?: (actor: Actor, worldCoords: { x: number, y: number }) => boolean;
  /** code to run on a down press event */
  public touchDown?: (actor: Actor, worldCoords: { x: number, y: number }) => boolean;
  /** code to run on a release event */
  public touchUp?: (actor: Actor, worldCoords: { x: number, y: number }) => boolean;
  /** code to run on a swipe event */
  public swipe?: (actor: Actor, point1: { x: number, y: number }, point2: { x: number, y: number }, time: number) => boolean;
  /** code to run when the mouse hovers over the actor */
  public mouseHover?: (actor: Actor, worldCoords: { x: number, y: number }) => boolean;
  /** code to run when the mouse stops hovering over the actor */
  public mouseUnHover?: (actor: Actor) => boolean;
}

/**
 * For the purpose of stickiness and pass-through surfaces, we treat things as
 * having four sides, as defined by this enum.
 */
export const enum Sides { TOP, RIGHT, BOTTOM, LEFT }

/**
 * PhysicsCfg describes provides advanced, but optional, ways of altering the
 * physical behavior of rigid bodies when they are being constructed.
 *
 * <!--
 * JetLag Developer Note: We replicate the documentation for PhysicsCfg in many
 * places. Please take care when adding to PhysicsCfg, so that the documentation
 * does not become stale.
 * -->
 */
export interface PhysicsCfg {
  /** The scene where this body should be made (defaults to stage.world) */
  scene?: Scene;
  /** The density of the body */
  density?: number;
  /** The elasticity of the body */
  elasticity?: number;
  /** The friction of the body */
  friction?: number;
  /** Should rotation be disabled? */
  disableRotation?: boolean;
  /** Do collisions happen, or do other bodies glide through this? */
  collisionsEnabled?: boolean;
  /** Which sides of the body are sticky, if any? */
  stickySides?: Sides[];
  /** Delay after something stops sticking, before it can stick again */
  stickyDelay?: number;
  /** Are collisions only valid from one direction? */
  singleRigidSide?: Sides;
  /** Entities with a matching nonzero Id don't collide with each other */
  passThroughId?: number[];
  /** The speed at which to rotate, in rotations per second */
  rotationSpeed?: number;
  /** Should the body be forced to be dynamic? */
  dynamic?: boolean;
  /** Should the body be forced to be kinematic? */
  kinematic?: boolean;
}

/**
 * JetLagGameConfig stores game-specific configuration values.  The programmer
 * makes one of these to tell JetLag how to run their game.
 */
export interface JetLagGameConfig {
  /**
   * The width and height of the game, in meters.  Common values are 16/9
   * (landscape) and 9/16 (portrait)
   */
  readonly aspectRatio: { width: number, height: number };
  /** Should JetLag print an outline around each actor in the game? */
  readonly hitBoxes: boolean;
  /** Configuration of any assets used by the game */
  readonly resources?: {
    /** The prefix for all resources */
    readonly prefix: string,
    /** The list of image files that can be used by the game */
    readonly imageNames?: string[];
    /** The list of audio files that can be used as sound effects by the game */
    readonly soundNames?: string[];
    /** The list of audio files that can be used as (looping) background music */
    readonly musicNames?: string[];
    /** The list of video files that can be used for cut scenes */
    readonly videoNames?: string[];
  };
  /** Key for accessing persistent storage */
  readonly storageKey?: string;
  /** Accelerometer mode (customize for each device target and orientation) */
  readonly accelerometerMode?: AccelerometerMode;
}
