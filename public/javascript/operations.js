$(document).ready(function() {
    /**
     * Logic for updating appointment statuses
     */
    $('#selected-status').on('change', function() {
        let status = $(this).val();
        let rows = [];

        //ignore if no row is selected
        if ($('.selected').length == 0) {
            return;
        }

        $('.selected').each(function() {
            rows.push($(this).attr('id'));
        });
        
        let update_params = {
            apptstatus: status,
            apptid_arr: JSON.stringify(rows)
        };

        console.log(update_params);

        /**
         * Makes an API call  to update the status of the selected rows
         */

        $.get('/api/update', update_params, function(data, status) {
            console.log(status);
            console.log(data);

            if (status != 'success') {
                alert('Error updating appointment status');
                window.location.href='/404';
                return;
            }

            //success message
            alert('Appointments updated successfully');
            location.reload();
        })

    })

    /**
     * Logic for deleting appointments
     * HARD DELETE
     */

    $('#delete-button').on('click', function() {
        let rows = [];

        //ignore if no row is selected
        if ($('.selected').length == 0) {
            return;
        }


        $('.selected').each(function() {
            rows.push($(this).attr('id'));
        });

        let delete_params = {
            apptid_arr: JSON.stringify(rows)
        };

        console.log(delete_params);

        /**
         * Makes an API call  to delete the status of the selected rows
         */

        $.get('/api/delete', delete_params, function(data, status) {
            console.log(status);
            console.log(data);

            if (status != 'success') {
                alert('Error deleting appointment');
                window.location.href='/404';
                return;
            }

            //success message
            alert('Appointments deleted successfully');
            location.reload();
        });
    });
})