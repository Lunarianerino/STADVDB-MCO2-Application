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
            apptid_arr: rows
        };

        console.log(update_params);

        /**
         * Make an API call here to update the status of the selected rows
         */

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
            apptid_arr: rows
        };

        console.log(delete_params);
    });
})