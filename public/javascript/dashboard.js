$(document).ready(function () {
    var fields = {};
    $.get('/api/getdashboard', function (data, status) {
        console.log(data);
        console.log(status);
        fields = data;

        var totalcount = data.luzoncount + data.visayascount + data.mindanaocount;

        var virtualtotal = data.virtualluzoncount + data.virtualvisayascount + data.virtualmindanaocount;

        var totalcomplete= data.luzoncomplete + data.visayascomplete + data.mindanaocomplete;

        var totalqueued = data.luzonqueued + data.visayasqueued + data.mindanaoqueued;

        var totalserving = data.luzonserving + data.visayasserving + data.mindanaoserving;

        var totalskipped = data.luzonskipped + data.visayasskipped + data.mindanaoskipped;

        var totalnoshow = data.luzonnoshow + data.visayasnoshow + data.mindanaonoshow;

        var totalcancel = data.luzoncancel + data.visayascancel + data.mindanaocancel;

        var totaldoctor = data.luzondoctor + data.visayasdoctor + data.mindanaodoctor;

        var totalclinic = data.luzonclinic + data.visayasclinic + data.mindanaoclinic;

        var totalpx = data.luzonpx + data.visayaspx + data.mindanaopx;

        var totaluser = totaldoctor + totalclinic + totalpx;

        fields = data;

        //add the totals
        $('#totalcount').text(totalcount);
        $('#virtualtotal').text(virtualtotal);
        $('#totalcomplete').text(totalcomplete);
        $('#totalqueued').text(totalqueued);
        $('#totalserving').text(totalserving);
        $('#totalskipped').text(totalskipped);
        $('#totalnoshow').text(totalnoshow);
        $('#totalcancel').text(totalcancel);
        $('#totaldoctor').text(totaldoctor);
        $('#totalclinic').text(totalclinic);
        $('#totalpx').text(totalpx);
        $('#totaluser').text(totaluser);
        

        //for each field add the data
        for (key in data) {
            $('#' + key).text(data[key]);
        }

    });



})