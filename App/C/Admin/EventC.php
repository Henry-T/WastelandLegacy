<?php
namespace App\C;
/**
 *         ▂▃╬▄▄▃▂▁▁
 *  ●●●█〓██████████████▇▇▇▅▅▅▅▅▅▅▅▅▇▅▅          BUG
 *  ▄▅████☆RED █ WOLF☆███▄▄▃▂
 *  █████████████████████████████
 *  ◥⊙▲⊙▲⊙▲⊙▲⊙▲⊙▲⊙▲⊙▲⊙◤
 *
 * 客户端访客类
 * @author 路漫漫
 * @link ahmerry@qq.com
 * @since
 * v2017/04/08 初版
 */

namespace App\C\Admin;
use App\M\EventsM;

class EventC extends AdminC {
    public function index(){
        $m = new EventsM();
        if(isset($_GET['id'])){
            echo ResultFormat(DelTransfer($m->find($_GET['id'])));
        }else{
            echo ResultFormat($m->getList());
        }
    }

    public function edit(){
        if(!isset($_POST['name'])) die();
        $m = new EventsM();
        if(isset($_POST['id'])){
            $result = $m->save(    $_POST);
        }else{
            $result = $m->add($_POST);
        }
        echo ResultFormat($result);
    }
}