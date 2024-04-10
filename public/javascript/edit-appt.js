$(document).ready(function() {
    console.info('Hello World!')
    /**
     * Logic for detecting change in the table
     */

    /**
     * Ajax Call for obtaining the appointment details
     */
    let initial_data = {};
    let apptid = $('#apptid').text();
    console.log("HERE IS THE APPTID: " + apptid)

    $.get('/api/getappt/' + apptid, function(data, status) {
        console.log(data);
        initial_data = data[0];
        data = data[0];
        console.log(status);
        if (status != 'success') {
            alert('Error loading appointment details');
            window.location.href='/404';
            return;
        }

        //fill the fields with the data
        $('#doctorid').text(data.doctorid);
        $('#clinicid').text(data.clinicid);
        $('#pxid').text(data.pxid);
        $('#apptstatus').text(data.apptstatus);

        //parse the dates
        const startdate = new Date(data.starttime);
        const enddate = new Date(data.endtime);

        $('#starttime').val(convertDateTimeLocal(startdate));
        $('#endtime').val(convertDateTimeLocal(enddate));
        $('#appttype').text(data.appttype);
        $('#hospital').text(data.hospital);
        $('#islandgroup').text(data.islandgroup);
        $('#region_name').text(data.region_name);
        $('#province').text(data.province);
        $('#city').text(data.city);



        console.log(data.isvirtual)
        switch(data.isvirtual){
            case 1:
                $('#isvirtual').html('<b>Virtual:</b> <i id="isvirtual" class="fa-solid fa-check" style="color: #"></i>');
                break;
            case 0:
                $('#isvirtual').html('<b>Virtual:</b> <i id="isvirtual" class="fa-solid fa-times"></i>');
                break;
        }
    });


    var changedFields = {};

    $('.editable[contenteditable=true]').on('input', function() {
        //check the value of the field, if different from data.x, add to changedFields
        let field = $(this).attr('id');
        let value = $(this).text();

        if (value != initial_data[field]) {
            changedFields[field] = value;
            //change background color of  the field to #736fdc
            $(this).css('color', '#736fdc');
            $(this).css('font-weight', 'bold');
        } else {
            delete changedFields[field];
            $(this).css('color', 'black');
            $(this).css('font-weight', 'normal');
        }

        /**
         * Logic for showing edit-buttons
         */
        if (Object.keys(changedFields).length > 0) {
            $('.edit-button').fadeIn();
            $('.cancel-button').fadeIn();
        } else{
            $('.edit-button').fadeOut();
            $('.cancel-button').fadeOut();
        }

    });

    /**
     * Logic for detecting change in the dates
     */
    
    $('#starttime').on('input', function() {
        let value = $(this).val();
        let field = 'starttime';
        let date = new Date(value);
        let formatted_date = date.toISOString().slice(0, 16);

        if (formatted_date != initial_data[field]) {
            changedFields[field] = formatted_date;
            $(this).css('color', '#736fdc');
            $(this).css('font-weight', 'bold');
        } else {
            delete changedFields[field];
            $(this).css('color', 'black');
            $(this).css('font-weight', 'normal');
        }

        /**
         * Logic for showing edit-buttons
         */
        if (Object.keys(changedFields).length > 0) {
            $('.edit-button').fadeIn();
            $('.cancel-button').fadeIn();
        } else{
            $('.edit-button').fadeOut();
            $('.cancel-button').fadeOut();
        }
    });

    $('#endtime').on('input', function() {
        let value = $(this).val();
        let field = 'endtime';
        let date = new Date(value);
        let formatted_date = date.toISOString().slice(0, 16);

        if (formatted_date != initial_data[field]) {
            changedFields[field] = formatted_date;
            $(this).css('color', '#736fdc');
            $(this).css('font-weight', 'bold');
        } else {
            delete changedFields[field];
            $(this).css('color', 'black');
            $(this).css('font-weight', 'normal');
        }

        /**
         * Logic for showing edit-buttons
         */
        if (Object.keys(changedFields).length > 0) {
            $('.edit-button').fadeIn();
            $('.cancel-button').fadeIn();
        } else{
            $('.edit-button').fadeOut();
            $('.cancel-button').fadeOut();
        }
    });

    /**
     * Logic for resetting appointment fields
     */
    $('.cancel-button').on('click', function() {
        //reset the fields
        for (key in changedFields) {
            $('#' + key).text(initial_data[key]);
            $('#' + key).css('color', 'black');
            $('#' + key).css('font-weight', 'normal');
            //reset values for dates
            if (key == 'starttime' || key == 'endtime') {
                $('#' + key).val(convertDateTimeLocal(new Date(initial_data[key])));
            }
        }
        changedFields = {};
        $('.edit-button').fadeOut();
        $('.cancel-button').fadeOut();
    });

    /**
     * Logic for editing appointment fields
     */
    $('.edit-button').on('click', function() {
        //send the changed fields to the server
        let update_params = {
            apptid_arr: JSON.stringify([apptid]),
            ...changedFields
        };

        console.log(update_params);

        //regex to add \ to the ' in the string
        for (key in update_params) {
            update_params[key] = update_params[key].replace(/'/g, "\\'");
        }

        $.get('/api/update', update_params, function(data, status) {
            console.log(status);
            console.log(data);

            if (status != 'success') {
                alert('Error updating appointment details');
                window.location.href='/404';
                return;
            }

            //success message
            alert('Appointment updated successfully');
            location.reload();
        });

    })

    


    

});

function convertDateTimeLocal(date){
    return date.toISOString().slice(0, 16);
}