$(document).ready(function() {
    /**
     * Logic for checking all node statuses
     * Calls /status using AJAX
     */
    $.get('/api/checkNodes', function(statuses) {
        console.log('Node Status Checked');
        console.log(statuses);

        if (statuses.CENTRAL_NODE == 200) {
            addclasses('#CENTRAL_NODE', 'up');
        } else {
            addclasses('#CENTRAL_NODE', 'down');
        }

        if (statuses.LUZON_NODE == 200) {
            addclasses('#LUZON_NODE', 'up');
        } else {
            addclasses('#LUZON_NODE', 'down');
        }

        if (statuses.VISMIN_NODE == 200) {
            addclasses('#VISMIN_NODE', 'up');
        } else {
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

});

function addclasses(status, type) {
    $(status).addClass(type);
}