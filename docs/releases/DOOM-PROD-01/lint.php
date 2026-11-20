<?php
$root=$argv[1];$php=0;$json=0;
foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS)) as $file){
 if($file->getExtension()==='php'){
  exec(escapeshellarg(PHP_BINARY).' -l '.escapeshellarg($file->getPathname()).' 2>&1',$lines,$status);
  if($status!==0){throw new RuntimeException(implode("\n",$lines));}$php++;
 }
 if($file->getExtension()==='json'){json_decode(file_get_contents($file->getPathname()),true,512,JSON_THROW_ON_ERROR);$json++;}
}
echo json_encode(['php_version'=>PHP_VERSION,'php_files'=>$php,'json_files'=>$json,'valid'=>true],JSON_PRETTY_PRINT),"\n";
