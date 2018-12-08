(function($) {

  $(document).ready(() => {
    const prevPage = sessionStorage.getItem('y');
    const prevFocus = sessionStorage.getItem('focus');

    if (prevPage) {
      const yScroll = parseInt(prevPage);
      window.scroll(0, yScroll);
    }

    if (prevFocus) {
      const focusIndex = parseInt(prevFocus);
      const panelIndex = parseInt(focusIndex / 5);
      const lowPanelIndex = focusIndex % 5;
      const $targetPanel = $('.suggest');
      $targetPanel.eq(panelIndex).find('.single_suggest').eq(lowPanelIndex).find('#suggest').focus();
    }

    (function scrollEvent() {
      $(window).on('scroll', (event) => {
        const window = event.currentTarget;
        sessionStorage.setItem('y', window.pageYOffset);
      });

      (function focusEvent() {
        $('.suggest').on('focus', '#suggest', (event) => {
          const $suggestPanel = $(event.currentTarget);
          const panelIndex = $suggestPanel.closest('.suggest').index();
          const lowPanelIndex = $suggestPanel.closest('.single_suggest').index();
          const currentIndex = (panelIndex * 5) + lowPanelIndex;
          sessionStorage.setItem('focus', currentIndex);
        });
      })();
    })();
  });
})($);
