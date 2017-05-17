#!/usr/bin/perl



use English;
use Carp;
use Getopt::Long;

sub Usage{
  my $message = shift;

  print STDERR $message, "\n" if $message;
  print STDERR "\nUsage: $0 -j(udgments) qrel-file -o o(utput-file-name) -trec < result \n";

  print STDERR <<'EOM';
	  -j(udgements) filename    Judgment file

	  -o(utput-file-name) filename Output file name

	  -t(rec)    TREC format, i.e., four column qrel and six column results
	             other wise, three column qrel and three column results

		    
          -h(elp) 	: display this message

EOM

    exit(1);

}

if (! &GetOptions("help","trec", "judgments=s", "outf=s") or
    $opt_help) {
  &Usage();
}


open(PR, ">$opt_outf") || die "can't create output file $opt_outf\n";
open(PRTAB, ">$opt_outf.tab") || die "can't create output file $opt_outf.tab\n";

open(T,"$opt_judgments") ||  die "can't open judgment file: $opt_judgments\n";

while (<T>) {
    if ($opt_trec) {
	($q,$dummy, $d,$v) = split;
    } else {
	($q,$d,$v) = split;
    }
    $dict{$q ."=".$d} =$v;
    if ($v == 1) {
	$totalRels{$q} ++;
    }
}

$curQ="";

@recLevel = (0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7,0.8, 0.9, 1.0);
@docLevel = (5, 10, 15, 20, 30, 100, 200, 500, 1000);

print PRTAB "Topic\tRel\tRetRel\tAvgPr\tExact";

for ($i=0; $i<=$#recLevel; $i++) {
    $precRec[$i] = 0;
    $avgPrecRec[$i] = 0;
    print PRTAB "\t",'pr@',$recLevel[$i];
}

for ($i=0; $i<=$#docLevel; $i++) {
    $precDoc[$i] = 0;
    $avgPrecDoc[$i] = 0;
    print PRTAB "\t",'pr@',$docLevel[$i];
}

print PRTAB "\n";


$countQuery = 0;
$setAvgPr = 0;
$setExactPr = 0;
$setTotalRel = 0;
$setRel = 0;

$rel = 0;
$avgPr = 0;
$exactPr = 0;
while (<stdin>) {

    if ($opt_trec) {
	($q, $dummy1, $d, $dummy2, $s, $dummy3) =split;    
    } else {
	($q,$d,$s) =split;
    }

    if ($q ne $curQ) { # new query
	$setTotalRel += $totalRels{$q};
	if ($curQ ne "") {
	    &PrintFigure;
	} 

	$curQ=$q;
	$avgPr = 0;
	$rankCount=0;
	$rel=0;

	for ($i=0; $i<=$#recLevel; $i++) {
	    $precRec[$i] = 0;
	}

	for ($i=0; $i<=$#docLevel; $i++) {
	    $precDoc[$i] = 0;
	}
    }
    
    $rankCount++;

    if ($totalRels{$q}==0) { next; } # skip any query with no judgments
    $judge = $dict{$q ."=".$d};
    if ($judge) {
	$rel++;
    }
    $thisPr = $rel/$rankCount;
    if ($judge) {
	$avgPr += $thisPr;
	
	for ($i=0; $i<=$#recLevel; $i++) {
	    if ($rel >= $recLevel[$i]*$totalRels{$q} && $thisPr >$precRec[$i]) {
		$precRec[$i] = $thisPr;
	    }
	}

    }
    if ($rankCount == $totalRels{$q}) {
	$exactPr = $thisPr;
    }
    for ($i=0; $i<=$#docLevel; $i++) {
	if ($rankCount == $docLevel[$i]) {
	    $precDoc[$i] = $thisPr;
	}
	
    }



}

if ($curQ ne "") {


    &PrintFigure;
} 

print PR "Set average over $countQuery topics\n";
print PR "Set average (non-interpolated) precision = ", $setAvgPr/$countQuery, "\n";
print PR "Set total number of relevant docs = $setTotalRel\n";
print PR "Set total number of retrieved relevant docs = $setRel\n";
print PR "Set average interpolated precision at recalls:\n";

print PRTAB "Summary\t$setTotalRel\t$setRel\t",$setAvgPr/$countQuery,"\t",$setExactPr/$countQuery;


for ($i=0; $i<=$#recLevel; $i++) {
    print PR " avg prec at $recLevel[$i] = ",$avgPrecRec[$i]/$countQuery,"\n";
    print PRTAB "\t",$avgPrecRec[$i]/$countQuery;
}
print PR "Set non-interpolated precsion at docs:\n";

for ($i=0; $i<=$#docLevel; $i++) {
    print PR " avg prec at $docLevel[$i] = ",$avgPrecDoc[$i]/$countQuery,"\n";
    print PRTAB "\t",$avgPrecDoc[$i]/$countQuery;
}
print PR "Set breakeven precision = ", $setExactPr/$countQuery,"\n";
print PRTAB "\n";

sub PrintFigure {
    if ($totalRels{$curQ}==0) {
#	print STDERR "Topic $curQ ignored: no judgments found\n";
	return;
    }
    $countQuery ++;
    print PR "Topic: $curQ\n";
    print PR "Total number of relevant docs = ", $totalRels{$curQ},"\n";
    print PR "Total number of retrieved relevant docs = ", $rel,"\n";

    print PRTAB "$curQ\t$totalRels{$curQ}\t$rel";
	  
    $p = $avgPr/$totalRels{$curQ};
    print PR "Average (non-interpolated) precision = $p\n";

    print PRTAB "\t$p\t$exactPr";

    print PR "Interpolated precsion at recalls:\n";
    $setAvgPr += $p;
    for ($i=0; $i<=$#recLevel; $i++) {
	print PR "  prec at ", $recLevel[$i], " = $precRec[$i]\n";
	print PRTAB "\t",$precRec[$i];
        $avgPrecRec[$i]+= $precRec[$i];
    }
    print PR "Non-interpolated precsion at docs:\n";

    for ($i=0; $i<=$#docLevel; $i++) {
	print PR "  prec at ", $docLevel[$i], " = $precDoc[$i]\n";
	print PRTAB "\t", $precDoc[$i];
	$avgPrecDoc[$i]+= $precDoc[$i];
    }
    print PR "Breakeven Precision: $exactPr\n";
    $setExactPr += $exactPr;
    $setRel += $rel;
    print PR "\n";
    print PRTAB "\n";
    return;
}

close(PR);
close(PRTAB);
