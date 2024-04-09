$(document).ready(function() {
    /**
     * Logic for search-utils-form
     */

    $('.search-utils-form').on('submit', function(e) {
        e.preventDefault();
        let apptid = $('.search-bar').val();
        let island = $('#island-filter').val();
        let status = $('#select-filter').val();
        let isvirtual = $('#type-filter').val();

        let search_params = {};
        if (apptid != '') {
            search_params.apptid = apptid;
        }

        if (island != 'all') {
            search_params.islandgroup = island;
        }

        if (status != 'all') {
            search_params.apptstatus = status;
        }

        if (isvirtual != 'all') {
            search_params.isvirtual = isvirtual;
        }

        if (Object.keys(search_params).length == 0) {
            window.location.replace(window.location.origin + '/');
        }

        console.log(search_params);

        /**
         * Make a call here to search for the appointments
         * Use query parameters to filter the results
         */

        let url = new URL(window.location.href);
        url.search = new URLSearchParams(search_params).toString();
        
        console.log(url.href);
        //reload the page with the new query parameters
        window.location.replace(url.href);
        });

        //fill the search form with the query parameters
        let url = new URL(window.location.href);
        let apptid = url.searchParams.get('apptid');
        let island = url.searchParams.get('islandgroup');
        let status = url.searchParams.get('apptstatus');
        let isvirtual = url.searchParams.get('isvirtual');

        if (apptid != null) {
            $('.search-bar').val(apptid);
        }

        if (island != null) {
            $('#island-filter').val(island);
        }

        if (status != null) {
            $('#select-filter').val(status);
        }

        if (isvirtual != null) {
            $('#type-filter').val(isvirtual);
        }

        console.log(apptid, island, status);
})