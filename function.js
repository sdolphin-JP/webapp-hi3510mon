/**
 * @file        function.js
 * @brief       Javascript functions.
 *
 * @author      (C) 2011-2021 sdolphin (https://www.sdolphin.jp/)
 * @date        2021/10/01
 * @note        Nothing special.
 * @attention   Nothing special.
 */


/******************************************************************************
 *  Global variables.
 *****************************************************************************/

/**
 * @brief Simulation mode.
 */
var g_isSimlation = false;

/**
 * @brief The time until to complete reboot.
 */
var g_Rebooting = 0;

/**
 * @brief Selected preset number.
 */
var g_SelectedPreset = -1;


/******************************************************************************
 *  Common.
 *****************************************************************************/

/**
 * @brief Create URL to access to API.
 *
 * @param {*} a_cmd Command.
 * @param {*} a_args Arguments.
 * @return URL to access to API.
 * @note If direct access to camera without PHP,
 *      It's better way that modify this function.
 */
function createApiURL(a_cmd, a_args)
{
    /*
     *  prm: cgi-bin/hi3510/param.cgi
     *  ptz: cgi-bin/hi3510/ptzctrl.cgi
     *  pre: cgi-bin/hi3510/preset.cgi
     *  rbt: cgi-bin/hi3510/sysreboot.cgi
     * jpgl: tmpfs/auto.jpg
     * jpgh: tmpfs/snap.jpg
     */

    return `hi3510api.php?cmd=${a_cmd}&arg=${encodeURIComponent(a_args)}`;
}


/******************************************************************************
 *  Control dialog.
 *****************************************************************************/

/**
 * @brief Close dialog.
 *
 * @param {*} a_suffix Dialog name.
 */
function closeDialog(a_suffix)
{
    $(`#id_dialog_${a_suffix}`).remove();
    $(`#id_mask_${a_suffix}`).remove();
}

/**
 * @brief Show Yes/No dialog.
 *
 * @param {*} a_text Text to display.
 * @param {*} a_onYes The function when Yes is pushed.
 * @param {*} a_onNo The function when No is pushed.
 */
function showConfirmDialog(a_text, a_onYes, a_onNo)
{
    $('#id_dialog_area').append('<div id="id_mask_confirm" class="b_mask_all"></div>');
    $('#id_dialog_area').append(''
        + '<div id="id_dialog_confirm" class="b_dialog">'
        + '    <h1 class="i_dialog_text">'
        + '        <span class="i_dialog_text-confirm">! CONFIRM !</span><br>'
        + `        ${a_text}`
        + '    </h1>'
        + '    <div id="id_dialog_confirm_yes" class="b_dialog_button">Y E S</div>'
        + '    <div id="id_dialog_confirm_no" class="b_dialog_button">N O</div>'
        + '</div>'
    );

    $('#id_dialog_confirm_yes').on('click', a_onYes);
    $('#id_dialog_confirm_no').on('click', a_onNo);
}

/**
 * @brief Show warning dialog.
 *
 * @param {*} a_text Text to display.
 */
 function showWarningDialog(a_text)
 {
     $('#id_dialog_area').append('<div id="id_mask_warning" class="b_mask_all"></div>');
     $('#id_dialog_area').append(''
         + '<div id="id_dialog_warning" class="b_dialog">'
         + '    <h1 class="i_dialog_text">'
         + '        <span class="i_dialog_text-warning">! WARNING !</span><br>'
         + `        ${a_text}`
         + '    </h1>'
         + `    <div class="b_dialog_button" onclick="closeDialog('warning')">O K</div>`
         + '</div>'
     );
 }

/**
 * @brief Show reboot dialog.
 */
function showRebootDialog()
{
    $('#id_dialog_area').append('<div id="id_mask_reboot" class="b_mask_all"></div>');
    $('#id_dialog_area').append(''
        + '<div id="id_dialog_reboot" class="b_dialog">'
        + '    <h1 class="i_dialog_text">再起動中です...</h1>'
        + '    <div class="b_dialog_progress_outer">'
        + '        <div class="b_dialog_progress_inner"></div>'
        + '    </div>'
        + '</div>'
    );
}


/******************************************************************************
 *  Apply apperelance.
 *****************************************************************************/

/**
 * @brief Set apperelance for preset.
 *
 * @param {*} a_selected_num The preset number to select.
 */
function selectPreset(a_selected_num)
{
    var item = [ $('#id_pre1'), $('#id_pre2'), $('#id_pre3'), $('#id_pre4'),
                    $('#id_pre5'), $('#id_pre6'), $('#id_pre7'), $('#id_pre8') ];

    for (var i = 0; i < item.length; i++)
    {
        item[i].removeClass('b_control_item_button_selected');
    }

    // If selected another position , change color.
    if ((0 < a_selected_num) && (item.length >= a_selected_num))
    {
        if (g_SelectedPreset != (a_selected_num - 1))
        {
            g_SelectedPreset = a_selected_num - 1;
            item[g_SelectedPreset].addClass('b_control_item_button_selected');
            return;
        }
    }

    g_SelectedPreset = -1;
}

/**
 * @brief Set apperelance for mirror of camera configuration.
 *
 * @param {*} a_status 'on' is selected, else is not selected.
 */
function dispCameraAttr_Mirror(a_status)
{
    $('#id_mirror').removeClass('b_control_item_button_selected');

    if (a_status === 'on')
    {
        $('#id_mirror').addClass('b_control_item_button_selected');
    }
}

/**
 * @brief Set apperelance for flip of camera configuration.
 *
 * @param {*} a_status 'on' is selected, else is not selected.
 */
function dispCameraAttr_Flip(a_status)
{
    $('#id_flip').removeClass('b_control_item_button_selected');

    if (a_status === 'on')
    {
        $('#id_flip').addClass('b_control_item_button_selected');
    }
}

/**
 * @brief Set apperelance for red led.
 *
 * @param {*} a_status 'auto' is auto, 'open' is enabled, 'close' is disabled.
 */
function dispRedLed(a_status)
{
    $('#id_redled_auto').removeClass('b_control_item_button_selected');
    $('#id_redled_open').removeClass('b_control_item_button_selected');
    $('#id_redled_close').removeClass('b_control_item_button_selected');
    $(`#id_redled_${a_status}`).addClass('b_control_item_button_selected');
}


/******************************************************************************
 *  Control camera.
 *****************************************************************************/

/**
 * @brief Get snapshot and apply to apperlance.
 *
 * @param {*} a_period Interval to get snapshot in msec.
 * @attention When rebooting or simulating, do nothing.
 */
function updateSnapshot(a_period)
{
    if (0 >= g_Rebooting)
    {
        if (!g_isSimlation)
        {
            $.ajax({ url: createApiURL('jpgl', ''), type: 'get', dataType:'text' })
            .done(function(respData) { document.getElementById('id_snapshot').src = `data:image/jpg;base64,${respData}`; })
            .fail(function() {})
            .always(function() { setTimeout(function() { updateSnapshot(a_period); }, a_period); });
        }
    }
}

/**
 * @brief Execute pan/tilt on camera.
 *
 * @param {*} a_order 'up','down' or etc. See reference.
 * @attention When rebooting or simulating, do nothing.
 */
function ptzCtrl(a_order)
{
    if (0 >= g_Rebooting)
    {
        if (!g_isSimlation)
        {
            $.get(createApiURL('ptz', `-step=0&-act=${a_order}&-speed=45`))
            .done(function(data) { console.log(data); });
        }
    }
}

/**
 * @brief Set the selected preset on camera.
 *
 * @attention If not selected, show warning dialog.
 * @attention When rebooting or simulating, do nothing.
 */
function setPreset()
{
    if (0 >= g_Rebooting)
    {
        if (0 > g_SelectedPreset)
        {
            showWarningDialog('プリセットを設定する前に、プリセットを選択してください。');
            return;
        }

        if (!g_isSimlation)
        {
            $.get(createApiURL('pre', `-act=set&-status=1&-number=${g_SelectedPreset}`))
            .done(function(data) { console.log(data); });
        }
    }
}

/**
 * @brief Unset the selected preset on camera.
 *
 * @attention If not selected, show warning dialog.
 * @attention When rebooting or simulating, do nothing.
 */
function unsetPreset()
{
    if (0 >= g_Rebooting)
    {
        if (0 > g_SelectedPreset)
        {
            showWarningDialog('プリセットを削除する前に、プリセットを選択してください。');
            return;
        }

        if (!g_isSimlation)
        {
            $.get(createApiURL('pre', `-act=set&-status=0&-number=${g_SelectedPreset}`))
            .done(function(data) { console.log(data); });
        }
    }
}

/**
 * @brief Execute the selected preset on camera.
 *
 * @attention If not selected, show warning dialog.
 * @attention When rebooting or simulating, do nothing.
 */
function doPreset()
{
    if (0 >= g_Rebooting)
    {
        if (0 > g_SelectedPreset)
        {
            showWarningDialog('プリセットを実行する前に、プリセットを選択してください。');
            return;
        }

        if (!g_isSimlation)
        {
            $.get(createApiURL('pre', `-act=goto&-number=${g_SelectedPreset}`))
            .done(function(data) { console.log(data); });
        }
    }
}

/**
 * @brief Get camera status from camera.
 *
 * @attention Apperelance will be changed.
 * @attention When rebooting, do nothing.
 */
function getCameraAttr()
{
    if (0 >= g_Rebooting)
    {
        $.getScript(createApiURL('prm', 'cmd=getimageattr'),
            function()
            {
                dispCameraAttr_Mirror(mirror);
                dispCameraAttr_Flip(flip);
            }
        );
    }
}

/**
 * @brief Set mirror status to camera.
 *
 * @attention Apperelance will be changed.
 * @attention When rebooting or simulating, do nothing.
 */
function setCameraAttr_mirror()
{
    if (0 >= g_Rebooting)
    {
        var mirror = 'on';

        if ($('#id_mirror').hasClass('b_control_item_button_selected'))
        {
            mirror = 'off';
        }

        if (!g_isSimlation)
        {
            $.get(createApiURL('prm', `cmd=setimageattr&-mirror=${mirror}`))
            .done(function(data) { console.log(data); });
        }

        dispCameraAttr_Mirror(mirror);
    }
}

/**
 * @brief Set flip status to camera.
 *
 * @attention Apperelance will be changed.
 * @attention When rebooting or simulating, do nothing.
 */
function setCameraAttr_flip()
{
    if (0 >= g_Rebooting)
    {
        var flip = 'on';

        if ($('#id_flip').hasClass('b_control_item_button_selected'))
        {
            flip = 'off';
        }

        if (!g_isSimlation)
        {
            $.get(createApiURL('prm', `cmd=setimageattr&-flip=${flip}`))
            .done(function(data) { console.log(data); });
        }

        dispCameraAttr_Flip(flip);
    }
}

/**
 * @brief Get red LED status from camera.
 *
 * @attention Apperelance will be changed.
 * @attention When rebooting, do nothing.
 */
function getRedLed()
{
    if (0 >= g_Rebooting)
    {
        $.getScript(createApiURL('prm', 'cmd=getinfrared'),
            function() { dispRedLed(infraredstat); }
        );
    }
}

/**
 * @brief Set red LED status to camera.
 *
 * @param {*} a_status 'auto' is auto, 'open' is enabled, 'close' is disabled.
 *
 * @attention Apperelance will be changed.
 * @attention When rebooting or simulating, do nothing.
 */
function setRedLed(a_status)
{
    if (0 >= g_Rebooting)
    {
        if (!g_isSimlation)
        {
            $.get(createApiURL('prm', `cmd=setinfrared&-infraredstat=${a_status}`))
            .done(function(data) { console.log(data); });
        }

        dispRedLed(a_status);
    }
}

/**
 * @brief Reboot according to the selection result and display the restart dialog.
 *
 * @attention set value to g_rebooting.
 */
function sysReboot()
{
    if (0 >= g_Rebooting)
    {
        showConfirmDialog('再起動してよろしいですか？',
            function()
            {
                closeDialog('confirm');

                if (!g_isSimlation)
                {
                    $.get(createApiURL('rbt', ''))
                    .done(function(data) { console.log(data); });
                }

                g_Rebooting = 60;
                showRebootDialog();
                watchRebootTimer();
            },
            function()
            {
                closeDialog('confirm');
            }
        );
    }
}

/**
 * @brief Wait for complete reboot.
 *
 * @attention This function is executed periodicalle untill g_rebooting is 0.
 * @attention g_rebooting is decreased in this function.
 * @attention Maybe after complete reboot, reboot dialog automatically closed.
 * @attention Maybe after complete reboot, camera config will got.
 */
function watchRebootTimer()
{
    setTimeout(function()
        {
            if (0 < g_Rebooting)
            {
                g_Rebooting--;

                if (0 < g_Rebooting)
                {
                    watchRebootTimer();
                }

                else
                {
                    initializeUpdate();
                    closeDialog('reboot');
                }
            }
        },
        1000
    );
}

/**
 * @brief Show record in another tab.
 *
 * @attention If you want to use this function,
 *          You have to configure web server can list records.
 */
function showRecord()
{
    window.open("../ipcam1-rec/files/captured?C=N;O=D");
}

/**
 * @brief Initialize apperelance.
 */
function initializeUpdate()
{
    updateSnapshot(800);
    getCameraAttr();
    getRedLed();
}


/******************************************************************************
 *  Main routine.
 *****************************************************************************/

$.ajaxSetup({
    cache: false,
    global:false
});

initializeUpdate();
