import { Assets, Graphics, Sprite as PixiSprite, Text as PixiText, Texture, VideoResource } from "pixi.js";
import { JetLagGameConfig } from "../Config";
import { stage } from "../Stage";

/** DebugSprite is used when we need to render a debug outline on an actor */
export class DebugSprite {
  /** The PIXI context that we use for making the shape's outline */
  readonly shape = new Graphics();

  /** A radial line when debugShape is a circle */
  readonly line = new Graphics();
}

/** A sprite is any picture that can be drawn to the screen */
export class Sprite {
  /** A debug context, for when we need to print shape outlines */
  readonly debug = new Graphics();

  /**
   * Construct a sprite
   *
   * @param imgName the name of the image file to load
   * @param sprite The PIXI sprite to use
   */
  constructor(readonly imgName: string, public sprite: PixiSprite) { }

  /**
   * Set the position of the sprite relative to some X/Y anchor point
   *
   * @param ax The X anchor
   * @param ay The Y anchor
   * @param x The X position relative to the anchor
   * @param y The Y position relative to the anchor
   */
  setAnchoredPosition(ax: number, ay: number, x: number, y: number) {
    this.sprite.anchor.set(ax, ay);
    this.sprite.position.set(x, y);
  }
}

/** Text is for anything that we render by using a string and a font */
export class Text {
  /** A debug context, for when we need to print the text's outline */
  readonly debug = new Graphics();

  /**
   * Create a Text object by wrapping a PIXI text
   *
   * @param text A PIXI text object
   */
  private constructor(readonly text: PixiText) { }

  /**
   * Create some text, with the font size scaled according to the stage's
   * current scale.
   *
   * @param txt   The text to show
   * @param opts  PIXI options for the text
   */
  public static makeText(txt: string, opts: any) {
    opts.fontSize = Math.floor(opts.fontSize * stage.fontScaling);
    return new Text(new PixiText(txt, opts));
  }
}

/**
 * ImageService provides a library of image objects that can be used at any
 * time.
 */
export class ImageLibraryService {
  /**
   * A map with all of the game's image-based textures in it.  This is slightly
   * easier using than PIXI.Assets directly, since we don't have to deal with
   * promises, but of course that means we handle the caching ourselves.
   */
  private imgTextures = new Map<string, Texture>;

  /**
   * A map with all of the game's video-based textures in it.
   *
   * TODO:  It would be beneficial to figure out if the way we are currently
   *        loading textures is appropriate for high-performance games.
   */
  private vidTextures = new Map<string, VideoResource>;

  /**
   * Load all of the graphics assets, then call the callback to start the game
   *
   * @param callback The code to run once all assets are loaded
   */
  loadAssets(callback: () => void) {
    // Fetch all of the videos first
    //
    // TODO:  Video fetching has an asynchronous aspect to it.  We are currently
    //        calling `load()` and ignoring the timing of the callback.  For
    //        lots of large video assets, this could mean that a cut scene would
    //        be requested before it was available.
    for (let vidName of this.config.videoNames!) {
      const res = new VideoResource(this.config.resourcePrefix + "/" + vidName, { autoPlay: false });
      res.load().then(x => x.source.autoplay = false)
      this.vidTextures.set(vidName, res);
    }
    // Next load all of the image assets, using the PIXI Assets infrastructure.
    // When they're all loaded, invoke the callback.
    Assets.load(this.config.imageNames).then((textures) => {
      for (let imgName of this.config.imageNames) {
        // If we loaded a sprite sheet, then we need to deconstruct it to get
        // all its image names.  Otherwise it's easy...
        if (imgName.match(".json") != null) {
          for (let o of Object.keys(textures[imgName].textures))
            this.imgTextures.set(o, textures[imgName].textures[o]);
        }
        else {
          this.imgTextures.set(imgName, textures[imgName]);
        }
      }
      callback();
    })
  }

  /**
   * Create the service by loading all of the game's image files
   *
   * @param config The game-wide configuration
   */
  constructor(private config: JetLagGameConfig) {
    // Set the names of the graphics assets, but don't load them yet.
    for (let imgName of config.imageNames!)
      Assets.add({ alias: imgName, src: config.resourcePrefix + imgName });
  }

  /**
   * Get an image that has been loaded by the renderer, or a blank image if the
   * provided filename is the empty string.
   *
   * TODO:  Screenshots currently necessitate the use of `""` as the imgName.
   *        Can we refactor so that's no longer an issue?
   *
   * @param imgName The name of the image to load
   *
   * @returns A Sprite built from the image
   */
  public getSprite(imgName: string) {
    let texture = this.imgTextures.get(imgName);
    if (!texture) {
      if (imgName !== "")
        throw "Unable to find graphics asset '" + imgName + "'";
      return new Sprite("", new PixiSprite());
    }
    // NB:  If we wanted to use Pixi to modify the texture, then we'd need to
    //      clone it first.
    return new Sprite(imgName, new PixiSprite(texture));
  }

  /**
   * Get a video that has been loaded by the renderer
   *
   * @param vidName The name of the video to load
   *
   * @returns A Sprite built from the video
   */
  public getVideo(vidName: string) {
    let texture = this.vidTextures.get(vidName);
    texture!.source.autoplay = false;
    texture!.source.preload = "auto";
    if (!texture)
      throw `Unable to find graphics asset '${vidName}'`;
    return new Sprite(vidName, new PixiSprite(Texture.from(texture.source)));
  }
}
