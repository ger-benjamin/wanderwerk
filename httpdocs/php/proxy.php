<?php
if (isset($_POST["lats"]) && isset($_POST["lngs"])) {
    $request = "http://ws.geonames.org/astergdem?lats=".$_POST["lats"]."&lngs=".$_POST["lngs"]."&username=ger.benjamin";
    $result = file_get_contents($request);
    $altitudes = explode("\r\n", $result);
    unset($altitudes[count($altitudes) - 1]);
    array_values($altitudes);
    echo json_encode($altitudes);
}
?>