// ToDo: use ES6 module
(function(global){
  let $ = (sel, el)=> el.querySelector(sel);
  let template = document.createElement('div');
  template.classList.add('sleekbar-container');
  template.innerHTML = `<div class="sleekbar-content"></div>\
<div class="sleekbar-x"><div class="handle"></div></div>\
<div class="sleekbar-y"><div class="handle"></div></div>`;

  global.SleekBar = el => {
    if(el.SleekBar) return el.SleekBar;
    return el.SleekBar = new SleekBar(el);
  }
  global.SleekBar.init = target => {
    (target || document).querySelectorAll('.sleekbar').forEach(global.SleekBar);
  }

  window.addEventListener('DOMContentLoaded', global.SleekBar.init, {once: true});

  class SleekBar{
    content = null;
    instance = null;
    container = null;
    onscroll = null;

    // Private var and undocumented, may be changed on the future
    _RO = null;
    _ignoreScrollEvent = false;

    constructor(content){
      this.instance = content;
      var that = this;

      let movedElement = null;
      let isX, isY, sWidth, sHeight, initialized = false, withRecalculate = true;
      let noX = false, noY = false;
      let pendingInit = this.init = ()=> {
        let view = content.ownerDocument.defaultView;
        let styles = view.getComputedStyle(content);
        isX = styles.overflowX === 'scroll';
        isY = styles.overflowY === 'scroll';

        if(!isX && !isY)
          withRecalculate = false;

        noX = view.getComputedStyle(container.querySelector('.sleekbar-x')).display === 'none';
        noY = view.getComputedStyle(container.querySelector('.sleekbar-y')).display === 'none';

        if((!isX || noX) && (!isY || noY)){
          withRecalculate = false;
          RO.disconnect();
        }

        recalculateInstance(styles);

        if(isX){
          sContent.style.overflowX = 'scroll';
          sContent.style.width = '100%';

          if(!noX){
            handleX.addEventListener('pointerdown', (ev)=> {
              ev.preventDefault();
              let x = ev.clientX, ori = sContent.scrollLeft;

              moveListener((ev)=> {
                sContent.scrollLeft = ori + (ev.clientX - x) * scaleX;
                ev.preventDefault();
              })
            });
          }
        }
        else{
          handleX.remove();
          sContent.style.overflowX = styles.overflowX;
        }

        if(isY){
          sContent.style.overflowY = 'scroll';
          sContent.style.height = '100%';

          if(!noY){
            handleY.addEventListener('pointerdown', (ev)=> {
              ev.preventDefault();
              let y = ev.clientY, ori = sContent.scrollTop;

              moveListener((ev)=> {
                sContent.scrollTop = ori + (ev.clientY - y) * scaleY;
                ev.preventDefault();
              })
            });
          }
        }
        else{
          handleY.remove();
          sContent.style.overflowY = styles.overflowY;
        }

        if(movedElement)
          movedElement.classList.add('sleekbar-visible');

        content.classList.add('sleekbar-instance'); // Turn into instance
        initialized = true;
      }

      function recalculateInstance(styles){
        if(!withRecalculate) return;

        let withHandle = styles === false;
        if(styles === false)
          styles = content.ownerDocument.defaultView.getComputedStyle(content);

        let time = Date.now();
        sWidth = parseInt(styles.width);
        sHeight = parseInt(styles.height);

        let took = Date.now() - time;
        if(took > 500){
          console.warn("Slow SleekBar initialization was detected. It can be caused by browser's forced element reflow or style recalculation.", {
            took:took+'ms',
            element: content
          });
        }

        if(withHandle)
          that.recalculate();
      }

      let parentNode = content.parentNode;
      let container = this.container = template.cloneNode(true);

      let handleSize = {x:0, y:0, width:1, height:1};
      let scaleX = 1;
      let scaleY = 1;

      let handleX = $('.sleekbar-x .handle', container);
      let handleY = $('.sleekbar-y .handle', container);

      const moveListener = (callback)=> {
        document.addEventListener('pointermove', callback);
        document.addEventListener('pointerup', (ev)=> {
          document.removeEventListener('pointermove', callback);
        }, {once:true});
      }

      let firstCalculate = false;
      let contentRect = null;

      let _pending = false;
      let RO = this._RO = new ResizeObserver((entries)=> {
        if(!initialized){
          if(_pending) return;

          _pending = true;
          return requestAnimationFrame(()=> setTimeout(pendingInit, 1));
        }

        if(entries[0].target === content){
          recalculateInstance(false);
          return;
        }

        contentRect = entries[0].contentRect;
        recalculateHandle();
      });

      RO.observe(content);

      let sContent = $('.sleekbar-content', container);
      if(content.tagName === 'TEXTAREA'){
        parentNode.insertBefore(container, content);
        sContent.append(content);
        RO.observe(content);
      }
      else{
        const hasWrap = content.querySelector('.sleekbar-wrap');
        movedElement = hasWrap ?? document.createElement('div');

        if(hasWrap == null){
          let childs = content.childNodes;
          for (var i = 0, n=childs.length; i < n; i++)
            movedElement.append(childs[0]);
        }

        sContent.append(movedElement);
        content.append(container);

        RO.observe(movedElement);
      }

      this.content = sContent;
      sContent.addEventListener('scroll', (ev)=> {
        var el = ev.target;
        if(isX && !noX)
          handleSize.x = el.scrollLeft / el.scrollWidth * sWidth;

        if(isY && !noY)
          handleSize.y = el.scrollTop / el.scrollHeight * sHeight;

        if(that._ignoreScrollEvent)
          that._ignoreScrollEvent = false;
        else if(that.onscroll)
          that.onscroll(ev);

        if(withRecalculate){
          !firstCalculate && recalculateHandle();
          applyHandle();
        }
      }, {passive: true});

      const recalculateHandle = ()=> {
        if(contentRect == null) return;

        firstCalculate = true;
        if(isX){
          handleSize.width = sWidth / contentRect.width * sWidth;
          if(handleSize.width > sWidth)
            handleSize.width = sWidth;
          scaleX = sWidth / handleSize.width;
        }

        if(isY){
          handleSize.height = sHeight / contentRect.height * sHeight;
          if(handleSize.height > sHeight)
            handleSize.height = sHeight;
          scaleY = sHeight / handleSize.height;
        }

        applyHandle();
      }

      // ToDo: get new contentRect
      setTimeout(recalculateHandle, 2000);

      this.recalculate = ()=>{
        contentRect = {
          width: sContent.scrollWidth,
          height: sContent.scrollHeight
        };

        recalculateHandle();
      }

      const applyHandle = ()=> {
        if(isX)
          handleX.style.cssText = `transform:translateX(${handleSize.x}px);width:${handleSize.width}px`;

        if(isY)
          handleY.style.cssText = `transform:translateY(${handleSize.y}px);height:${handleSize.height}px`;
      }
    }

    get scrollX(){
      return this.content.scrollLeft;
    }

    set scrollX(val){
      this._ignoreScrollEvent = true;
      this.content.scrollLeft = val;
    }

    get scrollY(){
      return this.content.scrollTop;
    }

    set scrollY(val){
      this._ignoreScrollEvent = true;
      this.content.scrollTop = val;
    }

    getPositionOf(element){
      return {
        x: element.offsetLeft,
        y: element.offsetTop
      };
    }

    destroy(){
      this._RO.disconnect();
      delete this.instance.SleekBar;
      this.instance.classList.remove('sleekbar-visible');
      this.container.parentNode.insertBefore(this.instance, this.container);
      this.container.remove();
    }
  }
})(window);