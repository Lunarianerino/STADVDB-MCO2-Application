
$(document).ready(function() {
    $('.load-more-button').click(function() {
        // change to actual ajax call
        // var last_id = ${'.post'}.last().attr('id');
        // $.ajax({
        //     type: 'POST',
        //     url: '/load_more',
        //     data: {
        //         last_id: last_id
        //     },
        //     success: function(data) {
        //         ${'.post'}.last().after(data);
        //     }
        // });

        for(i=0; i<11; i++){
            var row = '<tr>' +
                        '<td><input type="checkbox" class="select-box"></td>'+
                        '<td>Palawan</td>' +
                        '<td>Palawan</td>' +
                        '<td>Puerto Princesa</td>' +
                        '<td>Joe Biden</td>' +
                        '<td>Onsite</td>' +
                        '<td class="appstatus">NoShow</td>' +
                      '</tr>';
            $('.appointments-table').append(row);
        }
        


    });

    $('#select-all').click(function() {
        if ($(this).prop('checked')) {
            $('.select-box').prop('checked', true);
        } else {
            $('.select-box').prop('checked', false);
            $('.select-box').on('change', function(){
            var selected = [];
            if ($('.select-box:checked').length == 0) {
                $('#selected').hide();
            };
        })
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

        
    }); 



});

function addclasses(status, type) {
    //cancel if the row already has the class
    if ($(status).hasClass('status')) {
        return;
    }

    $(status). addClass('status');
    $(status).addClass(type);
    $(status).addClass('fade');
}