//document on ready

$(document).ready(function() {
    /**
     * Logic for loading first 10 appointments based on query parameters
     */
    let url = new URL(window.location.href);
    let limit = 10;
    
    let load_params = {
        limit: limit
    };
    
    let island = url.searchParams.get('islandgroup');
    let status_filter = url.searchParams.get('apptstatus');
    let apptid = url.searchParams.get('apptid');
    let isvirtual = url.searchParams.get('isvirtual');

    if (island != null) {
        load_params.islandgroup = island;
    }

    if (status_filter != null) {
        load_params.apptstatus = status_filter;
    }

    if (apptid != null) {
        load_params.apptid = apptid;
    }

    if (isvirtual != null) {
        load_params.isvirtual = isvirtual;
    }

    $.get('/api/find', load_params, function(data, status) {
        console.log(status);
        console.log(data);

        if (status != 'success') {
            alert('Error loading appointments');
            return;
        }

        if (data.length == 0) {
            var row = '<tr><td colspan="7"><center>No appointments found</center></td></tr>';
            $('.appointments-table').append(row);
            $('.load-more-button').hide();
            return;
        }
        if (data.length < 10) {
            $('.load-more-button').hide();
        }

        data.forEach(function(appt) {
            var row = '<tr id="' + appt.apptid + '">';
            row += '<td><input type="checkbox" class="select-box"></td>';
            row += '<td class="apptid-row">' + appt.apptid + '</td>';
            row += '<td>' + appt.islandgroup + '</td>';
            row += '<td>' + appt.province + '</td>';
            row += '<td>' + appt.city + '</td>';
            row += '<td>' + appt.appttype + '</td>';
            row += '<td>' + appt.apptstatus + '</td>';
            $('.appointments-table').append(row);
        });
        var isDragging = false;

        $('.apptid-row').mousedown(function() {
            isDragging = false;
        }).mousemove(function() {
            isDragging = true;
        }).mouseup(function() {
            var wasDragging = isDragging;
            isDragging = false;
            if (!wasDragging) {
                var apptid = $(this).html();
                window.location.href = window.location.origin + '/details/' + apptid;
            }
        });

    });


    /**
     * Logic for loading more appointments
     */
    $('.load-more-button').click(function() {
        var offset = $('.appointments-table tr').length;
        var limit = 10;

        var load_params = {
            offset: offset -1, //subtract 1 to exclude the header row
            limit: limit
        };

        //get filters from url query
        let url = new URL(window.location.href);
        let island = url.searchParams.get('islandgroup');
        let status_filter = url.searchParams.get('apptstatus');
        let apptid = url.searchParams.get('apptid');

        if (island != null) {
            load_params.islandgroup = island;
        }

        if (status_filter != null) {
            load_params.apptstatus = status_filter;
        }

        if (apptid != null) {
            load_params.apptid = apptid;
        }

        console.log(load_params);

        if (load_params.apptid != null) {
            $('.load-more-button').hide();
            return;
        }

        $.get('/api/find', load_params, function(data, status) {
            console.log(status);
            console.log(data);

            if (status != 'success') {
                alert('Error loading more appointments');
                return;
            }
            if (data.length < 10) {
                $('.load-more-button').hide();
            }

            data.forEach(function(appt) {
                var row = '<tr id="' + appt.apptid + '">';
                row += '<td><input type="checkbox" class="select-box"></td>';
                row += '<td class="apptid-row">' + appt.apptid + '</td>';
                row += '<td>' + appt.islandgroup + '</td>';
                row += '<td>' + appt.province + '</td>';
                row += '<td>' + appt.city + '</td>';
                row += '<td>' + appt.appttype + '</td>';
                row += '<td>' + appt.apptstatus + '</td>';
                $('.appointments-table').append(row);
            });   

            $('.apptid-row').mousedown(function() {
                isDragging = false;
            }).mousemove(function() {
                isDragging = true;
            }).mouseup(function() {
                var wasDragging = isDragging;
                isDragging = false;
                if (!wasDragging) {
                    var apptid = $(this).html();
                    window.location.href = window.location.origin + '/details/' + apptid;
                }
            });
            
        });
        
    });

});
