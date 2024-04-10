$(document).ready(function() {
    /**
     * Logic for displaying which port is shown
     */

    let url = location.port;


    switch (url) {
        case 20213:
            $("#current-node").text('CENTRAL_NODE');
            break;
        case 20214:
            $("#current-node").text('LUZON_NODE');
            break;
        case 20215:
            $("#current-node").text('VISMIN_NODE');
            break;
        default:
            $("#current-node").text('CENTRAL_NODE');
            break;
    }

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
                $('#CENTRAL_NODE').removeClass('down');
            } else {
                addclasses('#CENTRAL_NODE', 'down');
            }
    
            if (statuses.LUZON_NODE == 200) {
                addclasses('#LUZON_NODE', 'up');
                $('#LUZON_NODE').removeClass('down');
            } else {
                addclasses('#LUZON_NODE', 'down');
            }
    
            if (statuses.VISMIN_NODE == 200) {
                addclasses('#VISMIN_NODE', 'up');
                $('#VISMIN_NODE').removeClass('down');
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
            $('.dev-tools-contents').slideDown();
            $('#arrow-icon').attr('class', 'fa-solid fa-arrow-up');
            return; 
        } else {
            $(this).addClass('open');
            $('.dev-tools-contents').slideUp();
            $('#arrow-icon').attr('class', 'fa-solid fa-arrow-down');
        }
    });

    /**
     * Logic for adding a new appointment, redirect to /add
     */
    $('.add-button').click(function() {
        window.location.href = window.location.origin + '/add';
    });

    /**
     * Logic for showing add-button-tooltip when on hover
     */
    $('.add-button').hover(function() {
        $('.add-button-tooltip').slideDown();
    });

    $('.add-button').mouseleave(function() {
        $('.add-button-tooltip').slideUp();
    });
});

function addclasses(status, type) {
    $(status).addClass(type);
}