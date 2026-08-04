document.addEventListener("DOMContentLoaded", function () {
  function waitFor(ready, callback) {
    if (!ready()) {
      setTimeout(function () { waitFor(ready, callback); }, 100);
      return;
    }
    callback();
  }

  waitFor(
    function () {
      return typeof gsap !== "undefined"
        && typeof ScrollTrigger !== "undefined"
        && typeof SplitText !== "undefined";
    },
    function () {
      gsap.registerPlugin(ScrollTrigger, SplitText);
      // The mobile address bar resizing the viewport must not count as a layout
      // change, or every scroll on a phone triggers a full refresh.
      ScrollTrigger.config({ ignoreMobileResize: true });

      /* -----------------------------
         TITLE ANIMATION
      ----------------------------- */
      function initTitleAnimation(){
        document.querySelectorAll(".title-animation").forEach(el=>{
          const split = new SplitText(el,{
            type:"lines,words,chars",
            linesClass:"line",
            wordsClass:"word",
            charsClass:"char"
          });
          gsap.set(split.lines,{
            overflow:"hidden",
            display:"block"
          });
          gsap.set(split.chars,{
            y:10,
            opacity:0,
            filter:"blur(10px)"
          });
          split.lines.forEach((line,index)=>{
            const chars = line.querySelectorAll(".char");
            gsap.to(chars,{
              scrollTrigger:{
                trigger:el,
                start:"top 85%",
                once:true,
                invalidateOnRefresh:true
              },
              y:0,
              opacity:1,
              filter:"blur(0px)",
              duration:0.65,
              ease:"power3.out",
              stagger:{each:0.04},
              delay:index*0.25
            });
          });
        });
      }

      /* -----------------------------
         BUTTON TEXT ANIMATION
      ----------------------------- */
      function splitTextWithSpaces(el){
        const text = el.textContent;
        el.innerHTML = "";
        const chars = [];
        for(let i=0;i<text.length;i++){
          const char = text[i];
          const span = document.createElement("span");
          if(char === " "){
            span.innerHTML="&nbsp;";
          }else{
            span.textContent=char;
          }
          span.style.display="inline-block";
          el.appendChild(span);
          chars.push(span);
        }
        return chars;
      }
      function initButtonAnimation(selector){
        document.querySelectorAll(selector).forEach(button=>{
          const block = button.querySelector(".button-text-block");
          if(!block) return;
          const is1 = block.querySelector(".is-1");
          const is2 = block.querySelector(".is-2");
          if(!is1 || !is2) return;
          block.style.cssText += "position:relative;overflow:hidden;display:block;";
          is1.style.cssText += "display:block;position:relative;width:100%;";
          is2.style.cssText += "display:block;position:absolute;top:0;left:0;width:100%;";
          const is1Chars = splitTextWithSpaces(is1);
          const is2Chars = splitTextWithSpaces(is2);
          gsap.set(is2Chars,{
            yPercent:100,
            opacity:0
          });
          button.addEventListener("mouseenter",()=>{
            gsap.to(is1Chars,{
              yPercent:-100,
              opacity:0,
              duration:0.5,
              stagger:0.03,
              ease:"power2.out"
            });
            gsap.to(is2Chars,{
              yPercent:0,
              opacity:1,
              duration:0.5,
              stagger:0.03,
              ease:"power2.out"
            });
          });
          button.addEventListener("mouseleave",()=>{
            gsap.to(is1Chars,{
              yPercent:0,
              opacity:1,
              duration:0.5,
              stagger:0.03,
              ease:"power2.out"
            });
            gsap.to(is2Chars,{
              yPercent:100,
              opacity:0,
              duration:0.5,
              stagger:0.03,
              ease:"power2.out"
            });
          });
        });
      }

      /* -----------------------------
         COUNTER ANIMATION
      ----------------------------- */
      function initCounterAnimation(){
        document.querySelectorAll(".counter-anim").forEach(counter=>{
          const rawText = counter.innerText.trim();
          // Split into what comes before the number, the number, and what comes
          // after, so a value like "< 50ms" counts up as "< 50ms" and not
          // "50< ms". Values with no digits at all (e.g. "∞") are left alone.
          const parts = rawText.match(/^(\D*)([\d.]+)(.*)$/);
          if(!parts) return;
          const prefix = parts[1];
          const suffix = parts[3];
          const target = parseFloat(parts[2]);
          if(isNaN(target)) return;
          const obj = {val:0};
          gsap.to(obj,{
            scrollTrigger:{
              trigger:counter,
              start:"top 85%",
              once:true,
              invalidateOnRefresh:true
            },
            val:target,
            duration:1.2,
            ease:"none",
            onUpdate:function(){
              const display =
                Number.isInteger(target)
                  ? Math.floor(obj.val)
                  : obj.val.toFixed(1);
              counter.innerText = prefix + display + suffix;
            }
          });
        });
      }

      initButtonAnimation(".primary-button");
      initButtonAnimation(".secondary-button");

      // Splitting the headings reflows everything under them, so the counters
      // are measured afterwards and the whole page is refreshed once at the end.
      document.fonts.ready.then(function () {
        initTitleAnimation();
        initCounterAnimation();
        ScrollTrigger.refresh();
      });

      /* -----------------------------
         KEEPING TRIGGERS IN SYNC
      ----------------------------- */
      // Lazy images and late web fonts change the document height as you scroll.
      // Without a refresh, every trigger below the change is measured against a
      // stale layout and never fires - the section only animates after a reload.
      let pending;
      function scheduleRefresh(){
        clearTimeout(pending);
        pending = setTimeout(function () { ScrollTrigger.refresh(); }, 200);
      }

      window.addEventListener("load", scheduleRefresh);

      document.querySelectorAll("img").forEach(function (img) {
        if (!img.complete) {
          img.addEventListener("load", scheduleRefresh, { once: true });
          img.addEventListener("error", scheduleRefresh, { once: true });
        }
      });

      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(scheduleRefresh).observe(document.body);
      }
    }
  );
});
