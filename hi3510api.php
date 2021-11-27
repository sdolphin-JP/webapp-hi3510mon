<?php

/**
 * @file        hi3510api.php
 * @brief       Relay request to network camera which using hi3510.
 *
 * @author      (C) 2011-2021 sdolphin (https://www.sdolphin.jp/)
 * @date        2021/10/01
 * @note        Nothing special.
 * @attention   Nothing special.
 */


require_once('config.php');

$addArg = '';
if (isset($_GET['arg'])) { $addArg = $_GET['arg']; }

$addUrl  = '';
$isBse64 = false;
if (isset($_GET['cmd']))
{
    switch ($_GET['cmd'])
    {
        case 'prm':
            $addUrl = 'cgi-bin/hi3510/param.cgi?';
            break;
        case 'ptz':
            $addUrl = 'cgi-bin/hi3510/ptzctrl.cgi?';
            break;
        case 'pre':
            $addUrl = 'cgi-bin/hi3510/preset.cgi?';
            break;
        case 'rbt':
            $addUrl = 'cgi-bin/hi3510/sysreboot.cgi';
            $addArg = '';
            break;
        case 'jpgl':
            $addUrl  = 'tmpfs/auto.jpg';
            $addArg  = '';
            $isBse64 = true;
            break;
        case 'jpgh':
            $addUrl  = 'tmpfs/snap.jpg';
            $addArg  = '';
            $isBse64 = true;
            break;
    }
}

if (!('' === $addUrl))
{
    $url  = "${_CONF['host']}/${addUrl}${addArg}";
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Authorization: Basic ${_CONF['auth']}"
        ]
    ];

    $http_response_header = null;
    $res = file_get_contents($url, false, stream_context_create($opts));

    if (!is_null($http_response_header))
    {
        if ($isBse64) { $res = base64_encode($res); }
        foreach ($http_response_header as $item) { header($item); }
        echo $res;
        return;
    }
}

header("HTTP/1.1 405 Method Not Alloed");

?>
