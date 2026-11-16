namespace gdjs {
  /**
   * @category Core Engine > Loading Screen
   */
  export namespace watermark {
    export class RuntimeWatermark {
      _gameRenderer: RuntimeGameRenderer;
      _isDevEnvironment: boolean;

      // Configuration
      _placement:
        | 'top-left'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-right'
        | 'bottom'
        | 'top';
      _showAtStartup: boolean;
      _authorUsername: string | undefined;
      _gameId: string | undefined;

      // Dom elements
      _linkElement: HTMLAnchorElement | null = null;
      _containerElement: HTMLDivElement | null = null;
      _backgroundElement: HTMLDivElement | null = null;
      _svgElement: SVGElement | null = null;
      _usernameTextElement: HTMLSpanElement | null = null;
      _madeWithTextElement: HTMLSpanElement | null = null;

      _resizeObserver: ResizeObserver | null = null;

      // Durations in seconds
      _displayDuration: number = 20;
      _changeTextDelay: number = 7;
      _fadeInDelayAfterGameLoaded: number = 1;
      _fadeDuration: number = 0.3;

      // Timeout registration
      _fadeOutTimeout: NodeJS.Timeout | null = null;
      _hideTimeout: NodeJS.Timeout | null = null;
      _fadeOutFirstTextTimeout: NodeJS.Timeout | null = null;
      _fadeInSecondTextTimeout: NodeJS.Timeout | null = null;

      // Sizes
      _textFontSize: number = 14;
      _logoWidth: number = 56;
      _logoHeight: number = 45;
      _backgroundHeight: number = 150;
      _margin: number = 10;

      constructor(
        game: RuntimeGame,
        authorUsernames: Array<string>,
        watermarkData: WatermarkData
      ) {
        this._gameId = game._data.properties.projectUuid;
        this._gameRenderer = game.getRenderer();
        this._authorUsername = authorUsernames[0];
        this._placement = watermarkData.placement;
        // VoxForge: знак показывается всегда, отключить его в проекте нельзя.
        this._showAtStartup = true;
        this._isDevEnvironment = game.isUsingGDevelopDevelopmentEnvironment();
        this.addStyle();
      }

      displayAtStartup() {
        if (this._showAtStartup) {
          this.display();
        }
      }

      display() {
        const gameContainer = this._gameRenderer.getDomElementContainer();
        if (gameContainer) {
          this.addWatermarkToGameContainer(gameContainer);
          this._resizeObserver = new ResizeObserver(() => {
            const gameContainerRectangle =
              gameContainer.getBoundingClientRect();
            this.onResizeGameContainer(gameContainerRectangle.height);
          });
          this._resizeObserver.observe(gameContainer);
        }
      }

      private updateFontSize(height: number) {
        this._textFontSize = Math.max(0.025 * height, 12);
      }
      private updateLogoSize(height: number) {
        this._logoWidth = Math.max(0.06 * height, 25);
        this._logoHeight = Math.round((45 / 56) * this._logoWidth);
      }
      private updateBackgroundHeight(height: number) {
        this._backgroundHeight = Math.max(0.13 * height, 45);
      }
      private updateMargin(height: number) {
        this._margin = Math.max(0.025 * height, 8);
      }

      private onResizeGameContainer(height: number) {
        this.updateFontSize(height);
        if (this._madeWithTextElement) {
          this._madeWithTextElement.style.fontSize = `${this._textFontSize}px`;
        }
        if (this._usernameTextElement) {
          this._usernameTextElement.style.fontSize = `${this._textFontSize}px`;
        }
        this.updateLogoSize(height);
        if (this._svgElement) {
          this._svgElement.setAttribute('height', this._logoHeight.toString());
          this._svgElement.setAttribute('width', this._logoWidth.toString());
        }
        this.updateBackgroundHeight(height);
        if (this._backgroundElement) {
          this._backgroundElement.style.height = `${this._backgroundHeight}px`;
        }
        this.updateMargin(height);
        if (this._linkElement) {
          this.updateElementMargins(this._linkElement);
        }
      }

      private addWatermarkToGameContainer(container: HTMLElement) {
        const gameContainerRectangle = container.getBoundingClientRect();
        this.updateFontSize(gameContainerRectangle.height);
        this.updateLogoSize(gameContainerRectangle.height);
        this.updateBackgroundHeight(gameContainerRectangle.height);

        this._containerElement = this.createDivContainer();
        this.createBackground();
        const textContainer = document.createElement('div');

        this.generateSVGLogo(gameContainerRectangle.height);
        this.createMadeWithTextElement();
        this.createUsernameTextElement();

        this._linkElement = this.createLinkElement();

        if (this._svgElement)
          this._containerElement.appendChild(this._svgElement);
        if (this._madeWithTextElement)
          textContainer.appendChild(this._madeWithTextElement);
        if (this._usernameTextElement)
          textContainer.appendChild(this._usernameTextElement);
        this._containerElement.appendChild(textContainer);
        if (this._backgroundElement)
          container.appendChild(this._backgroundElement);

        this._linkElement.append(this._containerElement);
        container.appendChild(this._linkElement);

        this.setupAnimations();
      }

      private createBackground() {
        this._backgroundElement = document.createElement('div');
        this._backgroundElement.setAttribute('id', 'watermark-background');
        this._backgroundElement.style.height = `${this._backgroundHeight}px`;
        this._backgroundElement.style.opacity = '0';
        if (this._placement.startsWith('top')) {
          this._backgroundElement.style.top = '0';
          this._backgroundElement.style.backgroundImage =
            'linear-gradient(180deg, rgba(38, 38, 38, .6) 0%, rgba(38, 38, 38, 0) 100% )';
        } else {
          this._backgroundElement.style.bottom = '0';
          this._backgroundElement.style.backgroundImage =
            'linear-gradient(0deg, rgba(38, 38, 38, .6) 0%, rgba(38, 38, 38, 0) 100% )';
        }
      }

      private setupAnimations() {
        // Necessary to trigger fade in transition
        requestAnimationFrame(() => {
          // Display the watermark
          setTimeout(() => {
            if (
              !this._containerElement ||
              !this._backgroundElement ||
              !this._linkElement
            )
              return;
            this._containerElement.style.opacity = '1';
            this._backgroundElement.style.opacity = '1';
            this._linkElement.style.pointerEvents = 'all';
            if (this._svgElement) this._svgElement.classList.add('spinning');
          }, this._fadeInDelayAfterGameLoaded * 1000);
        });

        // Hide the watermark
        this._fadeOutTimeout = setTimeout(
          () => {
            if (!this._containerElement || !this._backgroundElement) {
              return;
            }
            this._containerElement.style.opacity = '0';
            this._backgroundElement.style.opacity = '0';

            // Completely remove the watermark once the fade out duration has ended.
            this._hideTimeout = setTimeout(
              () => {
                if (
                  !this._containerElement ||
                  !this._backgroundElement ||
                  !this._linkElement
                )
                  return;
                this._linkElement.style.pointerEvents = 'none';
                this._containerElement.style.display = 'none';
                this._backgroundElement.style.display = 'none';
                if (this._resizeObserver) this._resizeObserver.disconnect();
              },
              // Deactivate all interaction possibilities with watermark at
              // the end of the animation to make sure it doesn't deactivate too early
              this._fadeDuration * 1000
            );
          },
          (this._fadeInDelayAfterGameLoaded + this._displayDuration) * 1000
        );

        // Change text below watermark
        this._fadeOutFirstTextTimeout = setTimeout(
          () => {
            const { _madeWithTextElement, _usernameTextElement } = this;
            if (!_madeWithTextElement) return;

            // Do not hide madeWith text if there is no author username to display.
            if (_usernameTextElement) {
              _madeWithTextElement.style.opacity = '0';
              this._fadeInSecondTextTimeout = setTimeout(() => {
                _usernameTextElement.style.lineHeight = 'normal';
                _usernameTextElement.style.opacity = '1';
                _madeWithTextElement.style.lineHeight = '0';
              }, this._fadeDuration * 1000);
            }
          },
          (this._fadeInDelayAfterGameLoaded + this._changeTextDelay) * 1000
        );
      }

      private createMadeWithTextElement() {
        this._madeWithTextElement = document.createElement('span');
        this._madeWithTextElement.innerText = 'Made with VoxForge';
        this._madeWithTextElement.style.fontSize = `${this._textFontSize}px`;
      }

      private createUsernameTextElement() {
        if (!this._authorUsername) return;
        this._usernameTextElement = document.createElement('span');
        this._usernameTextElement.innerText = `@${this._authorUsername}`;
        this._usernameTextElement.style.fontSize = `${this._textFontSize}px`;
        this._usernameTextElement.style.opacity = '0';
        this._usernameTextElement.style.lineHeight = '0';
      }

      private updateElementMargins(element: HTMLElement) {
        switch (this._placement) {
          case 'top-left':
            element.style.top = `${this._margin}px`;
            element.style.left = `${this._margin}px`;
            break;
          case 'top-right':
            element.style.top = `${this._margin}px`;
            element.style.right = `${this._margin}px`;
            break;
          case 'bottom-left':
            element.style.bottom = `${this._margin}px`;
            element.style.left = `${this._margin}px`;
            break;
          case 'bottom-right':
            element.style.bottom = `${this._margin}px`;
            element.style.right = `${this._margin}px`;
            break;
          case 'top':
            element.style.top = `${this._margin}px`;
            element.style.left = '50%';
            element.style.transform = 'translate(-50%, 0)';
            break;
          case 'bottom':
          default:
            element.style.bottom = `${this._margin}px`;
            element.style.left = '50%';
            element.style.transform = 'translate(-50%, 0)';
            break;
        }
      }

      private createLinkElement(): HTMLAnchorElement {
        const linkElement = document.createElement('a');
        linkElement.id = 'watermark-link';

        // VoxForge: ссылка ведёт на наш сайт.
        const targetUrl = new URL('https://quorvox.github.io');

        if (!this._isDevEnvironment) {
          targetUrl.searchParams.set('utm_source', 'voxforge-game');
          targetUrl.searchParams.set('utm_medium', 'game-watermark');

          if (this._gameId) {
            targetUrl.searchParams.set('utm_campaign', this._gameId);
          }
        }
        linkElement.href = targetUrl.href;
        linkElement.target = '_blank';

        this.updateElementMargins(linkElement);

        return linkElement;
      }

      private createDivContainer(): HTMLDivElement {
        const divContainer = document.createElement('div');
        divContainer.setAttribute('id', 'watermark');

        divContainer.style.opacity = '0';
        return divContainer;
      }

      private generateSVGLogo(height: number) {
        this._svgElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );

        this.updateLogoSize(height);
        this._svgElement.setAttribute('height', this._logoHeight.toString());
        this._svgElement.setAttribute('width', this._logoWidth.toString());
        // VoxForge: лис (исходник branding/voxforge-fox.svg).
        this._svgElement.setAttribute('viewBox', '21 20 470 470');
        this._svgElement.setAttribute('fill', 'none');
        const svgNamespace = 'http://www.w3.org/2000/svg';
        const half: Array<[string, string, string]> = [
          ['100,30 46,252 184,164', '#6a37a3', '1'],
          ['104,92 80,226 166,172', '#ff8a2b', '1'],
          ['100,30 88,100 128,92', '#3b1d63', '1'],
          ['184,164 256,170 256,292 170,262', '#ff9a35', '1'],
          ['46,252 184,164 170,262 142,334 52,330', '#f0641d', '1'],
          ['52,330 142,334 118,432 70,394', '#8a4ac6', '1'],
          ['142,334 198,412 150,452 118,432', '#5a2d8f', '1'],
          ['256,170 234,234 256,292', '#ffc24b', '1'],
          ['140,274 214,298 160,302', '#3b1d63', '0.9'],
          ['142,334 176,316 212,410 198,412', '#efe8f8', '1'],
          ['176,316 196,316 212,410', '#ffffff', '1'],
          ['148,284 210,302 190,326 158,312', '#1c1030', '1'],
          ['184,298 202,304 192,314', '#ffffff', '1'],
        ];
        const addPolygon = (
          parent: Element,
          points: string,
          fill: string,
          opacity: string
        ) => {
          const polygon = document.createElementNS(svgNamespace, 'polygon');
          polygon.setAttribute('points', points);
          polygon.setAttribute('fill', fill);
          if (opacity !== '1') polygon.setAttribute('opacity', opacity);
          parent.appendChild(polygon);
        };
        const leftHalf = document.createElementNS(svgNamespace, 'g');
        const rightHalf = document.createElementNS(svgNamespace, 'g');
        rightHalf.setAttribute('transform', 'translate(512,0) scale(-1,1)');
        for (const [points, fill, opacity] of half) {
          addPolygon(leftHalf, points, fill, opacity);
          addPolygon(rightHalf, points, fill, opacity);
        }
        this._svgElement.appendChild(leftHalf);
        this._svgElement.appendChild(rightHalf);
        addPolygon(this._svgElement, '196,316 256,288 316,316 300,410 256,474 212,410', '#ffffff', '1');
        addPolygon(this._svgElement, '256,288 316,316 300,410 256,474', '#e9e1f4', '1');
        addPolygon(this._svgElement, '232,386 280,386 256,416', '#25132f', '1');
      }

      private addStyle() {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }

          5% {
            transform: rotate(-10deg);
            animation-timing-function: ease-out;
          }

          17% {
            transform: rotate(370deg);
            animation-timing-function: ease-in-out;
          }

          20% {
            transform: rotate(360deg);
            animation-timing-function: ease-in-out;
          }

          100% {
            transform: rotate(360deg);
          }
        }

        #watermark-background {
          position: absolute;
          pointer-events: none;
          width: 100%;
          transition-property: opacity;
          transition-duration: ${this._fadeDuration}s;
        }

        #watermark-link {
          all: unset;
          position: absolute;
          cursor: pointer;
          pointer-events: none;
          user-select: none;

          /* For Safari */
          -webkit-user-select: none;
        }

        #watermark {
          display: flex;
          flex-direction: row;
          align-items: center;
          transition-property: opacity;
          transition-duration: ${this._fadeDuration}s;
          transition-timing-function: ease-out;
        }

        #watermark > div {
          display: flex;
          flex-direction: column;
          margin-left: 5px;
        }

        #watermark span {
          color: white;
          font-family: 'Tahoma', 'Gill sans', 'Helvetica', 'Arial';
          font-size: ${this._textFontSize}px;
          transition: opacity;
          transition-duration: ${this._fadeDuration}s;

          /* For Safari */
          -webkit-transition: opacity;
          -webkit-transition-duration: ${this._fadeDuration}s;
        }

        #watermark svg.spinning {
          animation-name: spin;
          animation-direction: normal;
          animation-duration: 5s;
          animation-iteration-count: 3;
          animation-delay: 1.5s;
        }

        #watermark svg path {
          fill: white;
        }

        @media (hover: hover) {
          #watermark span {
            text-decoration: underline;
            text-decoration-style: solid;
            text-decoration-color: transparent;
          }

          #watermark:hover span {
            text-decoration-color: white;

            /* For Safari */
            -webkit-text-decoration-color: white;
          }
        }
        `;
        document.head.appendChild(styleElement);
      }
    }
  }
}

// VoxForge: поддержка Python (всегда в сборке, сам Python грузится лениво).
namespace gdjs {
  /** @category Other extensions > Python */
  export namespace python {
    const logger = new gdjs.Logger('Python');

    // VoxForge: Python в игре работает через Pyodide (CPython в WebAssembly).
    // Он подгружается с CDN при первом запуске кода, поэтому нужен интернет.
    const PYODIDE_VERSION = '0.26.4';
    const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

    let pyodide: any = null;
    let loadingPromise: Promise<any> | null = null;
    // Код, который просили выполнить, пока Pyodide грузится: выполнится после.
    const pending: Array<() => void> = [];

    const loadScript = (url: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Cannot load ' + url));
        document.head.appendChild(script);
      });

    const ensureLoaded = (): Promise<any> => {
      if (pyodide) return Promise.resolve(pyodide);
      if (!loadingPromise) {
        loadingPromise = (async () => {
          // @ts-ignore
          if (typeof loadPyodide === 'undefined') {
            await loadScript(PYODIDE_URL + 'pyodide.js');
          }
          // @ts-ignore
          pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
          logger.info('Python is ready.');
          pending.splice(0).forEach((task) => task());
          return pyodide;
        })();
        loadingPromise.catch((error) => {
          logger.error('Unable to start Python: ' + error);
          loadingPromise = null;
        });
      }
      return loadingPromise;
    };

    /** Начать загрузку Python заранее (например, при старте сцены). */
    export const preload = function () {
      ensureLoaded().catch(() => {});
    };

    /**
     * В выражениях редактора переносы строк удобно писать как \n:
     * превращаем их в настоящие.
     */
    const normalizeCode = (code: string): string =>
      code.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

    /**
     * Выполнить Python-код. Внутри кода доступны:
     *  - scene — текущая сцена (JS-объект gdjs.RuntimeScene);
     *  - objects(имя) — список экземпляров объекта на сцене;
     *  - game — игра (gdjs.RuntimeGame).
     * Если Python ещё грузится, код выполнится сразу после загрузки.
     */
    export const run = function (
      instanceContainer: gdjs.RuntimeInstanceContainer,
      code: string
    ) {
      const source = normalizeCode(code);
      const execute = () => {
        try {
          const globals = pyodide.globals;
          globals.set('scene', instanceContainer);
          globals.set('game', instanceContainer.getGame());
          globals.set('objects', (name: string) =>
            instanceContainer.getObjects(name) || []
          );
          pyodide.runPython(source);
        } catch (error) {
          logger.error('Python error: ' + error);
        }
      };
      if (pyodide) {
        execute();
      } else {
        pending.push(execute);
        ensureLoaded().catch(() => {});
      }
    };
  }
}
