$(document).ready(function() {
    var initial_data = {};
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
        console.log(changedFields)
        //reset color of edit-button to #736fdc
        $('.edit-button').css('background-color', '#736fdc');
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

        console.log(changedFields)
        $('.edit-button').css('background-color', '#736fdc');
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
        console.log(changedFields)
        $('.edit-button').css('background-color', '#736fdc');
        
    });

    /** 
     * Logic for isvirtual checkbox
    */
    $('#isvirtual').on('click', function() {
        let value = $(this).is(':checked');

        if (value != initial_data['isvirtual']) {
            changedFields['isvirtual'] = value;
        } else {
            delete changedFields['isvirtual'];
        }
        console.log(changedFields)
        $('.edit-button').css('background-color', '#736fdc');
    });

    /**
     * Logic for select boxes
     */

    var select_boxes = [];
    //append the select boxes to the select_boxes array
    $('select').each(function() {
        select_boxes.push($(this));
    });

    console.log(select_boxes)

    //for each select box add the logic for detecting changes
    select_boxes.forEach(function(select_box) {
        select_box.on('change', function() {
            let value = $(this).val();
            let field = $(this).attr('id');

            if (value != initial_data[field]) {
                changedFields[field] = value;
                $(this).css('color', '#736fdc');
                $(this).css('font-weight', 'bold');
            } else {
                delete changedFields[field];
                $(this).css('color', 'black');
                $(this).css('font-weight', 'normal');
            }
            console.log(changedFields)
            $('.edit-button').css('background-color', '#736fdc');
        });
    });

    /**
     * Logic for resetting appointment fields
     */
    $('.cancel-button').on('click', function() {
        //reset the fields by reloading the page
        location.reload();
    });


    $('.edit-button').on('click', function() {
        //disable if no changes and if changedFields.length > 15
        console.log('test')
        if (Object.keys(changedFields).length == 0) {
            alert('No changes detected');
            return;
        }

        if (Object.keys(changedFields).length < 14) {
            alert('Please fill in all the fields');
            return;
        }
        //change value of isvirtual to 0 or 1
        if (changedFields['isvirtual'] == true) {
            changedFields['isvirtual'] = 1;
        } else {
            changedFields['isvirtual'] = 0;
        }
        /**
         * Logic for sending the data to the server
         */
        $.get('/api/insert', changedFields, function(data, status) {
            console.log(status);
            console.log(data);
            if (status != 'success') {
                alert('Error adding appointment');
                return;
            }
            alert('Appointment added successfully');
            window.location.href='/';
        });
    });
})  