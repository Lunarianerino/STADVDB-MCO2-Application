$(document).ready(function() {
    /**
     * Logic for checking all node statuses
     * Calls /status using AJAX
     */
    $.get('/api/checkNodes', function(statuses) {
        console.log('Node Status Checked');
        console.log(statuses);
        try{
            if (statuses.CENTRAL_NODE == 200) {
                addclasses('#CENTRAL_NODE', 'up');
                removeClasses('#CENTRAL_NODE', 'down');
            } else {
                addclasses('#CENTRAL_NODE', 'down');
            }
    
            if (statuses.LUZON_NODE == 200) {
                addclasses('#LUZON_NODE', 'up');
                removeClasses('#LUZON_NODE', 'down');
            } else {
                addclasses('#LUZON_NODE', 'down');
            }
    
            if (statuses.VISMIN_NODE == 200) {
                addclasses('#VISMIN_NODE', 'up');
                removeClasses('#VISMIN_NODE', 'down');
            } else {
                addclasses('#VISMIN_NODE', 'down');
            }
        } catch (err) {
            console.log(err);
            addclasses('#CENTRAL_NODE', 'down');
            addclasses('#LUZON_NODE', 'down');
            addclasses('#VISMIN_NODE', 'down');
        }
        
    })

    /**
     * Logic for getting the selected rows
     */
    $('#select-all').click(function() {
        if ($(this).prop('checked')) {
            $('.select-box').prop('checked', true);
        } else {
            $('.select-box').prop('checked', false);
            var selected = [];
        }

        var selected = [];
        if ($('.select-box:checked').length == 0) {
            $('#selected').hide();
        }
        $('.select-box:checked').each(function() {
            selected.push($(this).parent().attr('id'));
        });
        $('#selected').show();
        $('#selected-number').html(selected.length);

        //add class "selected" to the row
        $('.select-box').each(function() {
            if ($(this).is(':checked')) {
                $(this).parent().parent().addClass('selected');
            } else {
                $(this).parent().parent().removeClass('selected');
            }
        });

        if ($('.select-box:checked').length == 0) {
            $('#selected').hide();
        }

        
    }); 

    $('.select-box').on('change', function() {
        var selected = [];
        $('.select-box:checked').each(function() {
            selected.push($(this).parent().attr('id'));
        });
        $('#selected').show();
        $('#selected-number').html(selected.length);

        //add class "selected" to the row
        $('.select-box').each(function() {
            if ($(this).is(':checked')) {
                $(this).parent().parent().addClass('selected');
            } else {
                $(this).parent().parent().removeClass('selected');
            }
        });
    
    });

    $('.appointments-table').on('change', '.select-box', function() {
        var selected = [];
        $('.select-box:checked').each(function() {
            selected.push($(this).parent().attr('id'));
        });
        $('#selected').show();
        $('#selected-number').html(selected.length);

        //add class "selected" to the row
        $('.select-box').each(function() {
            if ($(this).is(':checked')) {
                $(this).parent().parent().addClass('selected');
            } else {
                $(this).parent().parent().removeClass('selected');
            }
        });

        //hide if 0
        if ($('.select-box:checked').length == 0) {
            $('#selected').hide();
        }
    });


    /**
     * Logic for scroll-to-top-button
     */

    $(window).scroll(function() {
        if ($(this).scrollTop() > 800) {
            $('.scroll-to-top-button').fadeIn();
        } else {
            $('.scroll-to-top-button').fadeOut();
        }
    });

    $('.scroll-to-top-button').click(function() {
        $('html, body').animate({scrollTop: 0}, 800);
    });


    /**
     * Logic for dev-tools-popup
     */
    $('.dev-tools-popup').click(function() {
        //get if attribute is open
        var isOpen = $(this).attr('class').includes('open');
        //set class to open
        if (isOpen) {
            $(this).removeClass('open');
            $('.dev-tools-contents').hide();
            $('#arrow-icon').attr('class', 'fa-solid fa-arrow-up');
            return; 
        } else {
            $(this).addClass('open');
            $('.dev-tools-contents').show();
            $('#arrow-icon').attr('class', 'fa-solid fa-arrow-down');
        }
    });
});

function addclasses(status, type) {
    $(status).addClass(type);
}