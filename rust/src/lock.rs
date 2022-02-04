
#[macro_export]
macro_rules! lock {
    ($id:ident) => {
        $id.lock().expect("Locks should never fail")
    };
}

