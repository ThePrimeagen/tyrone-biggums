use std::fs::File;

use structopt::StructOpt;


#[derive(Debug, StructOpt, Clone)]
pub struct ReduceOpts {
    /// Activate debug mode
    pub file: String,
    pub divisor: usize,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let opts = ReduceOpts::from_args();

    let mut track_reader = csv::Reader::from_reader(File::open(&opts.file)?);

    let mut tracks: Vec<Vec<usize>> = vec![];
    let mut tmp: Vec<usize> = vec![];
    for result in track_reader.records() {
        let result = result?;
        tmp.push(result[1].parse()?);

        if tmp.len() == opts.divisor {
            tracks.push(tmp);
            tmp = vec![];
        }
    }

    if tmp.len() > 0 {
        tracks.push(tmp);
    }

    tracks
        .iter()
        .map(|vec| vec.iter().sum::<usize>() / vec.len())
        .for_each(|avg: usize| println!("{}", avg));

    return Ok(());
}


